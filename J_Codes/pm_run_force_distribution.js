vanPeng 06:39:32 PM
var sprintf = require('sprintf').sprintf;
var ForceDistributionRule = require('../../models/pm').ForceDistributionRule;
var PointsSystemClient = require('../../models/pm').PointsSystemClient;
var ForceDistributionGroup = require('../../models/pm').ForceDistributionGroup;
var OrganizationUnit = require('../../models/organization').OrganizationUnit;
var Position = require('../../models/position').Position;
var Company = require('../../models/structure').Company;
var AssessmentInstance = require('../../models/pm').AssessmentInstance;
var async = require('async');
var us = require('underscore');
var People = require('../../models/people').People;
var moment = require('moment');
var fs = require('fs');
/*@{*fore_distribution_alogrithm analysis
     1.from the high score grade to the low score grade
     2.the low score grade is  grater than equal any number commonly.
     3.the high score grade is less than equal  any number commonly.

     *****the high grade's people is less than the low grade's people*****
   }*/

/*@{
    example:
      绩效分制   people    company        force_distribution of company(true)   filter of people
      十分制      50        A, B,C          A,B                                 40
      -------------------------------------------
      五分制      100        B,C            B                                   80
      -------------------------------------------
      百分制      200        A,C            C                                   100
      -------------------------------------------
    step01: filter the AssessmentInstance Scheme ,group by the pointsystem  and static the people at different district.
    step02: filter the company(force_districution == true) ,get the filter_people.
    step04: sort ai_score  by the grade. 
    step04: get the distribution algorithm (A, B,C ,D,E,F)
    step05: static the amount of people by the distribution algorithm.
    step06: match the ForceDistributionRule && get the force_distribution grade.
    Algorithms:  sort search.
   }*/
//*@ callback the need data by a  ps_id_single.

var run_force_distribution = function(req, res) {
  var client = req.user.client.id;
  ////////////***********************************//////////////////////
  var search_company = String(req.body.company).split(',');
  var sEcho = req.body.sEcho ? req.body.sEcho : 1;
  //从第几行开始查
  var iDisplayStart = req.body.iDisplayStart ? req.body.iDisplayStart : 0;
  //每页显示的长度
  var iDisplayLength = req.body.iDisplayLength ? req.body.iDisplayLength : 10;
  var sSearch = req.body.sSearch || ''; //搜索框输入的值
  //查询条件
  var cond = {
    client: client,
    ai_status: '1',
  };
  cond.year = req.body.year || moment().format('YYYY'); //查询当年的
  var cond_pm = [];
  if (req.body.annual) { //年度
    cond_pm.push({
      period_type: '1',
      period_value: 0
    })
  };
  if (req.body.halfyear) { //半年
    cond_pm.push({
      period_type: '2',
      period_value: {
        $in: JSON.parse(req.body.halfyear)
      }
    })
  };
  if (req.body.quarter) { //季度
    cond_pm.push({
      period_type: '3',
      period_value: {
        $in: JSON.parse(req.body.quarter)
      }
    })
  };
  if (req.body.month) { //月度
    cond_pm.push({
      period_type: '4',
      period_value: {
        $in: JSON.parse(req.body.month)
      }
    })
  };
  //正则表达式－查询通用搜索框
  var re = /./;
  var cond_ss = [];
  if (sSearch != "") {
    re.compile(sSearch);
    var cond_ss = [{
      people_no: re
    }, {
      people_name: re
    }, {
      position_name: re
    }, {
      ou_name: re
    }];
  }
  if (cond_pm.length || cond_ss.length) {
    cond["$and"] = [];
    if (cond_pm.length) {
      cond["$and"].push({
        $or: cond_pm
      })
    };
    if (cond_ss.length) {
      cond["$and"].push({
        $or: cond_ss
      })
    };
  };
  //处理排序
  var col_num = req.body.col_num || 0;
  var col_name = [];
  if (req.body.sColumns) {
    col_name = req.body.sColumns.split(',')
    col_num = col_name.length;
  };
  //判断一共有多少个可以排序的字段
  var col_sort_num = 0;
  for (var i = 0; i < col_num; i++) {
    if (req.body['bSortable_' + i]) { //是可排序的字段
      col_sort_num += 1;
    };
  };
  var sort_cond = {
    period_type: 1,
    period_value: 1,
  };
  for (var i = 0; i < col_sort_num; i++) {
    if (req.body['iSortCol_' + i]) { //循环来判断是不是有
      var dir = req.body['sSortDir_' + i];

      sort_cond[col_name[req.body['iSortCol_' + i]]] = (dir == 'asc') ? 1 : -1;
    }
  };
  ///////////****************//////////////////////////////////////
  async.waterfall([

    function(cb) {
      async.parallel({
        ps_force_data: function(cb) {
          PointsSystemClient.findOne({
            client: client,
            is_base: true,
            activate: true,
            block: false,
            terminated: false
          }).exec(function(err, ps) {
            //get the company whose if_force == true
            //push the algorithms or rule_id into a stack.
            //organize the data style.for the back to use.
            var ps_arr = [];
            //*****the force_distribution data*********sort in array****//
            var force_company = [],
              algorithm = [],
              rule_id = [],
              is_manager_group = [];
            us.each(ps.company_force, function(force) {
              if (force.if_force) {
                if ( !! ~search_company.indexOf(String(force.company))) {
                  force_company.push(String(force.company));
                }
                algorithm.push(force.forced_distribution_grade_algorithm);
                rule_id.push(force.rule_id);
                if (force.is_manager_group) {
                  is_manager_group.push(force.manager_group_rule)
                }
              }

            })
            var arr = [];
            arr.push(ps.id);
            arr.push(force_company);
            arr.push(us.first(rule_id));
            arr.push(us.first(algorithm));
            //get the grades data
            arr.push(ps.grades);
            if (is_manager_group.length > 0) {
              arr.push(is_manager_group[0]);
            }
            cb(null, arr)
          })
        },
        rule_data: function(cb) {
          ForceDistributionRule.find({
            client: client
          }).exec(cb)
        },
        group_data: function(cb) {
          ForceDistributionGroup.find({
            client: client
          }).exec(cb)
        }
      }, cb)

    },
    function(results, cb) {
      //*  the foundation data value.inclue pointsystem data,rule_data,group_data******/
      var point_data = results.ps_force_data;
      var rule_data = results.rule_data;
      var group_data = results.group_data;
      var assess_cond = {
        client: client
      }
      assess_cond.ai_status = 1;
      assess_cond.points_system = point_data[0];

      async.series({
        update_data: function(cb) {
          AssessmentInstance.find(assess_cond).populate('position').exec(function(err, result) {
            var force_assess_data = us.filter(result, function(temp) {
              return !!~point_data[1].indexOf(String(temp.company))
            })

            //按公司分布，不启用管理者分布数据
            var assess_group_com_all = us.countBy(force_assess_data, function(com) {
              return com.company
            })
            //统计管理者分组的数据
            var position_manager = us.filter(force_assess_data, function(temp) {
              return temp.position.position_manager == true
            })
            //同一上级定管理者数据分组
            var ou_position_manager = us.groupBy(position_manager, function(temp) {
              return temp.position.position_direct_superior
            })

            var position_man = us.keys(ou_position_manager);
            var position_man_data = us.values(ou_position_manager);
            // console.log(ou_position_manager);
            //按公司分布的数据-剔除管理者的数据
            var in_position_manager = us.reject(force_assess_data, function(temp) {
              return temp.position.position_manager == true
            })
            //get the grades data   the index is 4.
            var grade_data = point_data[4] ? point_data[4] : '';
            // //sort the grades_data
            //////sort grade by grade_low_value
            var grade_data_sort = us.sortBy(grade_data, function(front, back) {
              return back - front
            })
            var grade_sort_arr = [];
            us.each(grade_data_sort, function(temp) {
              grade_sort_arr.push(temp.grade_name);
            })

            //考核得分匹配等级区间
            //统计不同绩效等级中落的人数
            //得到等级数据和绩效合同之间的对应关系，后面强制分布做排序、更新使用
            //给等级排序
            /**B+E的数据**/
            //* * * * * * * * * * * * * * * * * * * * /
            //B E的数据
            var E_data_pep_len = {}, E_data_pep_id = {};
            us.each(position_man, function(group) {
              var grade_ai_position_people = {}, grade_ai_position_people_sort = {};
              var ou_position_manager_value = ou_position_manager[group];
              var ou_position_manager_sort = us.sortBy(ou_position_manager_value, function(prev, next) {
                return next - prev
              })
              us.each(grade_data_sort, function(grade) {
                //同一上级管理者职位分组(公司)
                var position_data = us.filter(ou_position_manager_sort, function(temp) {
                  return temp.ai_score >= grade.grade_low_value && temp.ai_score <= grade.grade_high_value
                })
                grade_ai_position_people[grade.grade_name] = position_data.length;
                //将等级对应的人,按得分排序后放到数组里,后面第二次递归的时候需用到
                var group_data_position_sort = us.sortBy(position_data, function(prev, next) {
                  return next - prev
                })
                var pep_arr_position = [];
                us.each(group_data_position_sort, function(temp) {

                  //把人换成ID,ID唯一，people不一定唯一
                  // pep_arr.push(temp.people)
                  pep_arr_position.push(temp.id)
                })
                grade_ai_position_people_sort[grade.grade_name] = pep_arr_position;
              })
              E_data_pep_len[group] = grade_ai_position_people;
              E_data_pep_id[group] = grade_ai_position_people_sort;
            })
            //B F的数据
            var assess_group_pos = us.countBy(position_manager, function(pos) {
              return pos.position.id
            })
            var assess_group_pos_key = us.keys(assess_group_pos)
            //B-E的数据

            //绩效合同根据公司分组 ---按公司分布的实际数据 -启用管理者分组后定公司分组数据
            var assess_group_com = us.countBy(in_position_manager, function(com) {
              return com.company
            })
            var assess_group_com_key = us.keys(assess_group_com);
            //按公司分组B---过滤了管理者的
            var com_group = us.groupBy(in_position_manager, function(com) {
              return com.company
            })
            var com_group_key = us.keys(com_group);
            var com_group_values = us.values(com_group);
            var E_data_pep_len_com = {}, E_data_pep_id_com = {};
            us.each(com_group_key, function(group) {
              var grade_ai_com_people = {}, grade_ai_com_people_sort = {};
              var ou_com_manager_value = com_group[group];
              var com_group_sort = us.sortBy(ou_com_manager_value, function(prev, next) {
                return next - prev
              })
              us.each(grade_data_sort, function(grade) {
                //同一上级管理者职位分组(公司)
                var com_data = us.filter(com_group_sort, function(temp) {
                  return temp.ai_score >= grade.grade_low_value && temp.ai_score <= grade.grade_high_value
                })
                grade_ai_com_people[grade.grade_name] = com_data.length;
                //将等级对应的人,按得分排序后放到数组里,后面第二次递归的时候需用到
                var grade_ai_com_people_sort_data = us.sortBy(com_data, function(prev, next) {
                  return next - prev
                })
                var pep_arr_com = [];
                us.each(grade_ai_com_people_sort_data, function(temp) {

                  //把人换成ID,ID唯一，people不一定唯一 
                  // pep_arr.push(temp.people)
                  pep_arr_com.push(temp.id)
                })
                grade_ai_com_people_sort[grade.grade_name] = pep_arr_com;
              })
              E_data_pep_len_com[group] = grade_ai_com_people;
              E_data_pep_id_com[group] = grade_ai_com_people_sort;
            })
            /*A*B+E的数据**/
            // * * * * * * * * * * * * * * * *  * * /
            var force_com = point_data[1];
            //get the rule_id
            var force_rule = point_data[2];
            //get the force_distribution algorithm
            var force_algorithm = point_data[3];
            //if is_manager_group is  true  
            var force_is_manager_group = point_data[5] ? point_data[5] : '';
            // console.log(force_is_manager_group);
            //the algorithm branch.
            //**************通用的规则data***********************///
            var rule_data_single = us.find(rule_data, function(temp) {
              return us.isEqual(temp.id, String(force_rule))
            })
            var force_data_single = rule_data_single ? rule_data_single.force_data : '';
            /**自定义公司分组B*/ //未过滤管理者的
            var assess_group_com_all = us.countBy(force_assess_data, function(com) {
              return com.company
            })
            var assess_group_com_key_all = us.keys(assess_group_com_all);
            //B//按公司分组B，未过来管理者的。
            var com_group_all = us.groupBy(force_assess_data, function(com) {
              return com.company
            })
            var com_group_key_all = us.keys(com_group_all);
            var com_group_values_all = us.values(com_group_all);
            var E_data_pep_len_com_all = {}, E_data_pep_id_com_all = {};
            us.each(com_group_key_all, function(group) {
              var grade_ai_com_people = {}, grade_ai_com_people_sort = {};
              var ou_com_manager_value = com_group_all[group];
              var com_group_sort = us.sortBy(ou_com_manager_value, function(prev, next) {
                return next - prev
              })
              us.each(grade_data_sort, function(grade) {
                //同一上级管理者职位分组(公司)
                var com_data = us.filter(com_group_sort, function(temp) {
                  return temp.ai_score >= grade.grade_low_value && temp.ai_score <= grade.grade_high_value
                })
                grade_ai_com_people[grade.grade_name] = com_data.length;
                //将等级对应的人,按得分排序后放到数组里,后面第二次递归的时候需用到
                var grade_ai_com_people_sort_data = us.sortBy(com_data, function(prev, next) {
                  return next - prev
                })
                var pep_arr_com = [];
                us.each(grade_ai_com_people_sort_data, function(temp) {

                  //把人换成ID,ID唯一，people不一定唯一 
                  // pep_arr.push(temp.people)
                  pep_arr_com.push(temp.id)
                })
                grade_ai_com_people_sort[grade.grade_name] = pep_arr_com;
              })
              E_data_pep_len_com_all[group] = grade_ai_com_people;
              E_data_pep_id_com_all[group] = grade_ai_com_people_sort;
            })
            /* * * * * * * * * * * * * * C D数据* * * * * * * * * * * * * * * * * */
            //CD + EF 
            //按部门分组，过滤了管理者的
            var ou_group = us.groupBy(in_position_manager, function(ou) {
              return ou.ou
            })
            var ou_group_key = us.keys(ou_group);
            var ou_group_values = us.values(ou_group);
            var E_data_pep_len_ou = {}, E_data_pep_id_ou = {};
            us.each(ou_group_key, function(group) {
              var grade_ai_com_people = {}, grade_ai_com_people_sort = {};
              var ou_com_manager_value = ou_group[group];
              var com_group_sort = us.sortBy(ou_com_manager_value, function(prev, next) {
                return next - prev
              })
              us.each(grade_data_sort, function(grade) {
                //同一上级管理者职位分组(公司)
                var com_data = us.filter(com_group_sort, function(temp) {
                  return temp.ai_score >= grade.grade_low_value && temp.ai_score <= grade.grade_high_value
                })
                grade_ai_com_people[grade.grade_name] = com_data.length;
                //将等级对应的人,按得分排序后放到数组里,后面第二次递归的时候需用到
                var grade_ai_com_people_sort_data = us.sortBy(com_data, function(prev, next) {
                  return next - prev
                })
                var pep_arr_com = [];
                us.each(grade_ai_com_people_sort_data, function(temp) {

                  //把人换成ID,ID唯一，people不一定唯一 
                  // pep_arr.push(temp.people)
                  pep_arr_com.push(temp.id)
                })
                grade_ai_com_people_sort[grade.grade_name] = pep_arr_com;
              })
              E_data_pep_len_ou[group] = grade_ai_com_people;
              E_data_pep_id_ou[group] = grade_ai_com_people_sort;
            })
            //按自定义部门分组,过滤了管理者的
            var assess_group_ou = us.countBy(in_position_manager, function(ou) {
              return ou.ou
            })
            var assess_group_ou_key = us.keys(assess_group_ou);
            //CD ^ EF
            //按部门分组，未过滤管理者的
            var ou_group_all = us.groupBy(force_assess_data, function(ou) {
              return ou.ou
            })
            var ou_group_key_all = us.keys(ou_group_all);
            var ou_group_values_all = us.values(ou_group_all);
            var E_data_pep_len_ou_all = {}, E_data_pep_id_ou_all = {};
            us.each(ou_group_key_all, function(group) {
              var grade_ai_com_people = {}, grade_ai_com_people_sort = {};
              var ou_com_manager_value = ou_group_all[group];
              var com_group_sort = us.sortBy(ou_com_manager_value, function(prev, next) {
                return next - prev
              })
              us.each(grade_data_sort, function(grade) {
                //同一上级管理者职位分组(公司)
                var com_data = us.filter(com_group_sort, function(temp) {
                  return temp.ai_score >= grade.grade_low_value && temp.ai_score <= grade.grade_high_value
                })
                grade_ai_com_people[grade.grade_name] = com_data.length;
                //将等级对应的人,按得分排序后放到数组里,后面第二次递归的时候需用到
                var grade_ai_com_people_sort_data = us.sortBy(com_data, function(prev, next) {
                  return next - prev
                })
                var pep_arr_com = [];
                us.each(grade_ai_com_people_sort_data, function(temp) {

                  //把人换成ID,ID唯一，people不一定唯一 
                  // pep_arr.push(temp.people)
                  pep_arr_com.push(temp.id)
                })
                grade_ai_com_people_sort[grade.grade_name] = pep_arr_com;
              })
              E_data_pep_len_ou_all[group] = grade_ai_com_people;
              E_data_pep_id_ou_all[group] = grade_ai_com_people_sort;
            })
            //按自定义部门分组，未过滤管理者的
            var assess_group_ou_all = us.countBy(force_assess_data, function(ou) {
              return ou.ou
            })
            var assess_group_ou_key_all = us.keys(assess_group_ou_all);

            /////////////////////////*****************/////////////////////////
            if (force_is_manager_group != undefined && force_is_manager_group) {
              switch (force_algorithm) {
                case 'A':
                  async.parallel({
                    manager_data: function(cb) {
                      if (force_is_manager_group == 'E') {
                        //同一上级管理者（公司）
                        get_manager_position_e(position_man, ou_position_manager, force_data_single, E_data_pep_len, E_data_pep_id, grade_sort_arr, function(data) {
                          cb(null, data)
                        })

                      } else {
                        //自定义管理者分组
                        var group_data_clone = us.clone(group_data);
                        get_manager_position_f(group_data_clone, grade_data_sort, grade_sort_arr, assess_group_pos_key, assess_group_pos, force_data_single, position_manager, function(data) {
                          cb(null, data)
                        })
                      }
                    },
                    com_data: function(cb) {
                      //循环每一个分组，落在分组间的公司将进行强制分布
                      async.times(com_group_key.length, function(n, next) {
                        var group_com = com_group_key[n];
                        var com_group_len = com_group[group_com].length;
                        var rule_force = us.filter(force_data_single, function(temp) {
                          return temp.pep_low_value <= com_group_len && temp.pep_high_value >= com_group_len;
                        })
                        var E_pep_len = us.values(E_data_pep_len_com[group_com]);
                        var E_pep_id = E_data_pep_id_com[group_com];
                        var sort_grade_pep_clone = us.clone(E_pep_len);
                        var grade_pep_clone = us.clone(E_pep_id);
                        // console.log(grade_ai_people_sort);
                        //在for循环里递归,最终要的是递归之后返回的值如何继续运用到后续的循环中去
                        var grade_sort_arr_clone_len = grade_sort_arr.length;
                        for (var i = 0; i < grade_sort_arr.length; i++) {
                          var grade_rule_match = us.find(rule_force, function(rule) {
                            return rule.grade_name == grade_sort_arr[i]
                          })
                          var force_scale = grade_rule_match ? grade_rule_match.force_scale : ''
                          //sort_grade_pep_clone[i + 1]  == grade_ai_people[grade_sort_arr[i]]
                          if (force_scale == '2') {
                            var force_pep_value = grade_rule_match ? grade_rule_match.force_pep_value : '';
                            //对强制分布值和其实际等级人数值进行比较
                            if (force_pep_value <= sort_grade_pep_clone[i]) {
                              //多出来的数据
                              var leave_data = sort_grade_pep_clone[i] - force_pep_value;
                              sort_grade_pep_clone[i] = force_pep_value;
                              //将多出来的挤到数组后边去
                              sort_grade_pep_clone[i + 1] += leave_data;
                              /***/
                              var slice_len = grade_pep_clone[grade_sort_arr[i]].length - leave_data;
                              var slice_first = grade_pep_clone[grade_sort_arr[i]].length;
                              var temp_pep = grade_pep_clone[grade_sort_arr[i]].slice(slice_len, slice_first);
                              //将被前边借走的数据从栈里边删除
                              grade_pep_clone[grade_sort_arr[i]] = us.reject(grade_pep_clone[grade_sort_arr[j + 1]], function(temp) {
                                return !!~temp_pep.indexOf(temp)
                              })
                              //从后边借来的**放回自己的栈里
                              us.each(temp_pep, function(temp) {
                                grade_pep_clone[grade_sort_arr[i + 1]].push(temp)
                              })
                              /**/
                              //人的递归及排序--不太好操作，人员无法排序，所以在后面再重新组装
                            } else {

                              var absence_pep = force_pep_value - sort_grade_pep_clone[i];
                              //不够的人数，从后面抽取
                              //直接赋给一个变量得不到值，需先调用函数，再赋值。
                              //调用了两次才能得到值.
                              sort_grade_pep_clone[i] = force_pep_value;
                              //克隆一份初始数据,不能直接赋值操作(可以直接赋值操作，只不过前面我的赋值操作是在递归调用之后);
                              var j = i;
                              get_data(absence_pep)
                              //recursion function

                              function get_data(absence_pep) {
                                if (grade_pep_clone[grade_sort_arr[j + 1]] < absence_pep) {
                                  absence_pep = absence_pep - sort_grade_pep_clone[j + 1];
                                  sort_grade_pep_clone[j + 1] = 0;
                                  /****/
                                  var temp_pep = grade_pep_clone[grade_sort_arr[j + 1]].slice(0, absence_pep);
                                  //将被前边借走的数据从栈里边删除
                                  grade_pep_clone[grade_sort_arr[j + 1]] = us.reject(grade_pep_clone[grade_sort_arr[j + 1]], function(temp) {
                                    return !!~temp_pep.indexOf(temp)
                                  })
                                  //从后边借来的**放回自己的栈里
                                  us.each(temp_pep, function(temp) {
                                    grade_pep_clone[grade_sort_arr[i]].push(temp)
                                  })
                                  /****/
                                  j++;
                                  get_data(absence_pep)
                                } else {
                                  if (grade_pep_clone[grade_sort_arr[j + 1]]) {
                                    var leave_data = sort_grade_pep_clone[j + 1] - absence_pep;

                                    sort_grade_pep_clone[j + 1] = leave_data;

                                    /***/
                                    var temp_pep = grade_pep_clone[grade_sort_arr[j + 1]].slice(0, absence_pep);
                                    //将被前边借走的数据从栈里边删除
                                    grade_pep_clone[grade_sort_arr[j + 1]] = us.reject(grade_pep_clone[grade_sort_arr[j + 1]], function(temp) {
                                      return !!~temp_pep.indexOf(temp)
                                    })
                                    //从后边借来的**放回自己的栈里
                                    us.each(temp_pep, function(temp) {
                                      grade_pep_clone[grade_sort_arr[i]].push(temp)
                                    })
                                    /****/
                                  } else {
                                    //后边没数据了，往前边拉几个过来
                                    var leave_data = sort_grade_pep_clone[j - 1] - absence_pep;
                                    sort_grade_pep_clone[j - 1] = leave_data;
                                    /***/
                                    var slice_len = grade_pep_clone[grade_sort_arr[j - 1]].length - leave_data;
                                    var slice_first = grade_pep_clone[grade_sort_arr[j - 1]].length;
                                    var temp_pep = grade_pep_clone[grade_sort_arr[j - 1]].slice(slice_len, slice_first);
                                    //将被前边借走的数据从栈里边删除
                                    grade_pep_clone[grade_sort_arr[j - 1]] = us.reject(grade_pep_clone[grade_sort_arr[j - 1]], function(temp) {
                                      return !!~temp_pep.indexOf(temp)
                                    })
                                    //从后边借来的**放回自己的栈里
                                    us.each(temp_pep, function(temp) {
                                      grade_pep_clone[grade_sort_arr[i]].push(temp)
                                    })
                                    /****/
                                  }
                                  // return ;     
                                }
                              }
                            }
                          } else {
                            var force_pep_value = grade_rule_match.force_pep_value ? grade_rule_match.force_pep_value : '';
                            if (force_pep_value <= sort_grade_pep_clone[i]) {
                              //多出来的数据,也全部给她----即强制分布后的值不变,因为它自己已经足够不需要从别处借
                              sort_grade_pep_clone[i] = sort_grade_pep_clone[i];
                            } else {
                              //因为是要>=，不够了当然要从后边的借,算法和前边<=是相同的不够就从后面去借
                              var absence_pep = force_pep_value - sort_grade_pep_clone[i];
                              //不够的人数，从后面抽取
                              //直接赋给一个变量得不到值，需先调用函数，再赋值。
                              //调用了两次才能得到值.
                              sort_grade_pep_clone[i] = force_pep_value;
                              //克隆一份初始数据,不能直接赋值操作(可以直接赋值操作，只不过前面我的赋值操作是在递归调用之后);
                              var j = i;
                              get_datas(absence_pep)
                              //recursion function
                              function get_datas(absence_pep) {
                                //判断后边是否还有数据，没有则不递归了

                                if (grade_pep_clone[grade_sort_arr[j + 1]] < absence_pep) {
                                  absence_pep = absence_pep - sort_grade_pep_clone[j + 1];
                                  sort_grade_pep_clone[j + 1] = 0;
                                  /****/
                                  var temp_pep = grade_pep_clone[grade_sort_arr[j + 1]].slice(0, absence_pep);
                                  //将被前边借走的数据从栈里边删除
                                  grade_pep_clone[grade_sort_arr[j + 1]] = us.reject(grade_pep_clone[grade_sort_arr[j + 1]], function(temp) {
                                    return !!~temp_pep.indexOf(temp)
                                  })
                                  //从后边借来的**放回自己的栈里
                                  us.each(temp_pep, function(temp) {
                                    grade_pep_clone[grade_sort_arr[i]].push(temp)
                                  })
                                  /****/
                                  j++;
                                  get_datas(absence_pep)
                                } else {
                                  if (grade_pep_clone[grade_sort_arr[j + 1]]) {
                                    var leave_data = sort_grade_pep_clone[j + 1] - absence_pep
                                    sort_grade_pep_clone[j + 1] = leave_data;
                                    // return ; 
                                    /***/
                                    var temp_pep = grade_pep_clone[grade_sort_arr[j + 1]].slice(0, absence_pep);
                                    //将被前边借走的数据从栈里边删除
                                    grade_pep_clone[grade_sort_arr[j + 1]] = us.reject(grade_pep_clone[grade_sort_arr[j + 1]], function(temp) {
                                      return !!~temp_pep.indexOf(temp)
                                    })
                                    //从后边借来的**放回自己的栈里
                                    us.each(temp_pep, function(temp) {
                                      grade_pep_clone[grade_sort_arr[i]].push(temp)
                                    })
                                    /****/
                                    //后边没数据了，往前边拉几个    
                                  } else {
                                    var leave_data = sort_grade_pep_clone[j - 1] - absence_pep;
                                    sort_grade_pep_clone[j - 1] = leave_data;
                                    /***/
                                    var slice_len = grade_pep_clone[grade_sort_arr[j - 1]].length - absence_pep;
                                    var slice_first = grade_pep_clone[grade_sort_arr[j - 1]].length;
                                    var temp_pep = grade_pep_clone[grade_sort_arr[j - 1]].slice(slice_len, slice_first);
                                    //将被前边借走的数据从栈里边删除
                                    grade_pep_clone[grade_sort_arr[j - 1]] = us.reject(grade_pep_clone[grade_sort_arr[j - 1]], function(temp) {
                                      return !!~temp_pep.indexOf(temp)
                                    })
                                    //从后边借来的**放回自己的栈里 
                                    us.each(temp_pep, function(temp) {
                                      grade_pep_clone[grade_sort_arr[i]].push(temp)
                                    })
                                    /****/
                                  }
                                }

                              }
                            }
                          }

                        }
                        console.log(grade_pep_clone['A'].length + 'length1');
                        console.log(grade_pep_clone['B'].length + 'length1');
                        console.log(grade_pep_clone['C'].length + 'length1');
                        console.log(grade_pep_clone['D'].length + 'length1');
                        console.log(grade_pep_clone['E'].length + 'length1');
                        // console.log(grade_pep_clone['A']);
                        async.times(grade_sort_arr.length, function(n, next) {
                          var grade_sort_arr_single = grade_sort_arr[n];
                          var assessment_id_arr = grade_pep_clone[grade_sort_arr_single];
                          if (assessment_id_arr.length > 0) {
                            async.times(assessment_id_arr.length, function(n, next) {
                              var assessment_id = assessment_id_arr[n];
                              var update_data = {
                                ai_forced_distribution_grade: grade_sort_arr_single
                              }
                              AssessmentInstance.findByIdAndUpdate(assessment_id, update_data, function(err, result) {
                                // console.log(result.ai_forced_distribution_grade);
                                next(null, result)
                              })
                            }, next)
                          } else {
                            next(null, null)
                          }

                        }, next)

                      }, function(err, result) {
                        cb(null, result)
                      })
                    }
                  }, function(err, result) {
                    cb(null, result)
                  })
                  break;
                case 'B':
                  async.parallel({
                    manager_data: function(cb) {
                      if (force_is_manager_group == 'E') {
                        //同一上级管理者（公司）
                        get_manager_position_e(position_man, ou_position_manager, force_data_single, E_data_pep_len, E_data_pep_id, grade_sort_arr, function(data) {
                          cb(null, data)
                        })


                      } else {
                        //自定义管理者分组  
                        var group_data_clone = us.clone(group_data);
                        get_manager_position_f(group_data_clone, grade_data_sort, grade_sort_arr, assess_group_pos_key, assess_group_pos, force_data_single, position_manager, function(data) {
                          cb(null, data)
                        })
                      }
                    },
                    com_data: function(cb) {
                      //循环每一个分组，落在分组间的公司将进行强制分布
                      var group_data_clone = us.clone(group_data);
                      async.times(group_data_clone.length, function(n, next) {
                        var group_com = group_data_clone[n].companies;
                        var force_company = us.filter(assess_group_com_key, function(temp) {
                          return !!~group_com.indexOf(temp)
                        })

                        var pep = 0;
                        us.each(force_company, function(temp) {
                          pep += assess_group_com[temp];
                        })
                        // var rule_data_single = us.find(rule_data, function(temp) {
                        //   return us.isEqual(temp.id, String(force_rule))
                        // })
                        // var force_data_single = rule_data_single ? rule_data_single.force_data : '';
                        var rule_force = us.filter(force_data_single, function(temp) {
                          return temp.pep_low_value <= pep && temp.pep_high_value >= pep;
                        })
                        var in_position_manager_filter = us.filter(in_position_manager, function(temp) {
                          return !!~group_com.indexOf(temp.company)
                        })
                        //取排序后的数据
                        var in_position_manager_sort = us.sortBy(in_position_manager_filter, function(pre, next) {
                          return next - pre
                        })
                        var grade_ai_score = {}, grade_ai_people = {}, grade_ai_people_sort = {};
                        us.each(grade_data_sort, function(grade) {
                          //自定义公司组
                          var group_data = us.filter(in_position_manager_sort, function(temp) {
                            return temp.ai_score >= grade.grade_low_value && temp.ai_score <= grade.grade_high_value
                          })
                          grade_ai_score[grade.grade_name] = group_data;
                          grade_ai_people[grade.grade_name] = group_data.length;
                          //将等级对应的人,按得分排序后放到数组里,后面第二次递归的时候需用到
                          var group_data_sort = us.sortBy(group_data, function(prev, next) {
                            return next - prev
                          })
                          var pep_arr = [],
                            pep_score = [];
                          us.each(group_data_sort, function(temp) {

                            //把人换成ID,ID唯一，people不一定唯一
                            // pep_arr.push(temp.people)
                            pep_arr.push(temp.id)
                            pep_score.push(temp.ai_score)
                          })
                          grade_ai_people_sort[grade.grade_name] = pep_arr;

                          // console.log(grade.grade_name);  
                          // return grade_name
                        })
                        //取排序后的等级对应人数值，并clone一份备用 ---公司的
                        var sort_grade_pep = us.values(grade_ai_people);
                        var sort_grade_pep_clone = us.clone(sort_grade_pep);
                        var grade_pep_clone = us.clone(grade_ai_people_sort);
                        // console.log(grade_ai_people_sort);
                        //在for循环里递归,最终要的是递归之后返回的值如何继续运用到后续的循环中去
                        var grade_sort_arr_clone_len = grade_sort_arr.length;
                        for (var i = 0; i < grade_sort_arr.length; i++) {
                          var grade_rule_match = us.find(rule_force, function(rule) {
                            return rule.grade_name == grade_sort_arr[i]
                          })
                          var force_scale = grade_rule_match ? grade_rule_match.force_scale : ''
                          //sort_grade_pep_clone[i + 1]  == grade_ai_people[grade_sort_arr[i]]
                          if (force_scale == '2') {
                            var force_pep_value = grade_rule_match ? grade_rule_match.force_pep_value : '';
                            //对强制分布值和其实际等级人数值进行比较
                            if (force_pep_value <= sort_grade_pep_clone[i]) {
                              //多出来的数据
                              var leave_data = sort_grade_pep_clone[i] - force_pep_value;
                              sort_grade_pep_clone[i] = force_pep_value;
                              //将多出来的挤到数组后边去
                              sort_grade_pep_clone[i + 1] += leave_data;
                              /***/
                              var slice_len = grade_pep_clone[grade_sort_arr[i]].length - leave_data;
                              var slice_first = grade_pep_clone[grade_sort_arr[i]].length;
                              var temp_pep = grade_pep_clone[grade_sort_arr[i]].slice(slice_len, slice_first);
                              //将被前边借走的数据从栈里边删除
                              grade_pep_clone[grade_sort_arr[i]] = us.reject(grade_pep_clone[grade_sort_arr[j + 1]], function(temp) {
                                return !!~temp_pep.indexOf(temp)
                              })
                              //从后边借来的**放回自己的栈里
                              us.each(temp_pep, function(temp) {
                                grade_pep_clone[grade_sort_arr[i + 1]].push(temp)
                              })
                              /**/
                              //人的递归及排序--不太好操作，人员无法排序，所以在后面再重新组装
                            } else {
                              var absence_pep = force_pep_value - sort_grade_pep_clone[i];
                              //不够的人数，从后面抽取
                              //直接赋给一个变量得不到值，需先调用函数，再赋值。
                              //调用了两次才能得到值.
                              sort_grade_pep_clone[i] = force_pep_value;
                              //克隆一份初始数据,不能直接赋值操作(可以直接赋值操作，只不过前面我的赋值操作是在递归调用之后);
                              var j = i;
                              get_data(absence_pep)
                              //recursion function

                              function get_data(absence_pep) {
                                if (grade_ai_people[grade_sort_arr[j + 1]] < absence_pep) {
                                  absence_pep = absence_pep - sort_grade_pep_clone[j + 1];
                                  sort_grade_pep_clone[j + 1] = 0;
                                  /****/
                                  var temp_pep = grade_pep_clone[grade_sort_arr[j + 1]].slice(0, absence_pep);
                                  //将被前边借走的数据从栈里边删除
                                  grade_pep_clone[grade_sort_arr[j + 1]] = us.reject(grade_pep_clone[grade_sort_arr[j + 1]], function(temp) {
                                    return !!~temp_pep.indexOf(temp)
                                  })
                                  //从后边借来的**放回自己的栈里
                                  us.each(temp_pep, function(temp) {
                                    grade_pep_clone[grade_sort_arr[i]].push(temp)
                                  })
                                  /****/
                                  j++;
                                  get_data(absence_pep)
                                } else {
                                  if (grade_ai_people[grade_sort_arr[j + 1]]) {
                                    var leave_data = sort_grade_pep_clone[j + 1] - absence_pep;

                                    sort_grade_pep_clone[j + 1] = leave_data;

                                    /***/
                                    var temp_pep = grade_pep_clone[grade_sort_arr[j + 1]].slice(0, absence_pep);
                                    //将被前边借走的数据从栈里边删除
                                    grade_pep_clone[grade_sort_arr[j + 1]] = us.reject(grade_pep_clone[grade_sort_arr[j + 1]], function(temp) {
                                      return !!~temp_pep.indexOf(temp)
                                    })
                                    //从后边借来的**放回自己的栈里
                                    us.each(temp_pep, function(temp) {
                                      grade_pep_clone[grade_sort_arr[i]].push(temp)
                                    })
                                    /****/
                                  } else {
                                    //后边没数据了，往前边拉几个过来
                                    var leave_data = sort_grade_pep_clone[j - 1] - absence_pep;
                                    sort_grade_pep_clone[j - 1] = leave_data;
                                    /***/
                                    var slice_len = grade_pep_clone[grade_sort_arr[j - 1]].length - leave_data;
                                    var slice_first = grade_pep_clone[grade_sort_arr[j - 1]].length;
                                    var temp_pep = grade_pep_clone[grade_sort_arr[j - 1]].slice(slice_len, slice_first);
                                    //将被前边借走的数据从栈里边删除
                                    grade_pep_clone[grade_sort_arr[j - 1]] = us.reject(grade_pep_clone[grade_sort_arr[j - 1]], function(temp) {
                                      return !!~temp_pep.indexOf(temp)
                                    })
                                    //从后边借来的**放回自己的栈里
                                    us.each(temp_pep, function(temp) {
                                      grade_pep_clone[grade_sort_arr[i]].push(temp)
                                    })
                                    /****/
                                  }
                                  // return ;     
                                }
                              }
                            }
                          } else {
                            var force_pep_value = grade_rule_match ? grade_rule_match.force_pep_value : '';
                            if (force_pep_value <= sort_grade_pep_clone[i]) {
                              //多出来的数据,也全部给她----即强制分布后的值不变,因为它自己已经足够不需要从别处借
                              sort_grade_pep_clone[i] = sort_grade_pep_clone[i];
                            } else {
                              //因为是要>=，不够了当然要从后边的借,算法和前边<=是相同的不够就从后面去借
                              var absence_pep = force_pep_value - sort_grade_pep_clone[i];
                              //不够的人数，从后面抽取
                              //直接赋给一个变量得不到值，需先调用函数，再赋值。
                              //调用了两次才能得到值.
                              sort_grade_pep_clone[i] = force_pep_value;
                              //克隆一份初始数据,不能直接赋值操作(可以直接赋值操作，只不过前面我的赋值操作是在递归调用之后);
                              var j = i;
                              get_datas(absence_pep)
                              //recursion function
                              function get_datas(absence_pep) {
                                //判断后边是否还有数据，没有则不递归了

                                if (grade_ai_people[grade_sort_arr[j + 1]] < absence_pep) {
                                  absence_pep = absence_pep - sort_grade_pep_clone[j + 1];
                                  sort_grade_pep_clone[j + 1] = 0;
                                  /****/
                                  var temp_pep = grade_pep_clone[grade_sort_arr[j + 1]].slice(0, absence_pep);
                                  //将被前边借走的数据从栈里边删除
                                  grade_pep_clone[grade_sort_arr[j + 1]] = us.reject(grade_pep_clone[grade_sort_arr[j + 1]], function(temp) {
                                    return !!~temp_pep.indexOf(temp)
                                  })
                                  //从后边借来的**放回自己的栈里
                                  us.each(temp_pep, function(temp) {
                                    grade_pep_clone[grade_sort_arr[i]].push(temp)
                                  })
                                  /****/
                                  j++;
                                  get_datas(absence_pep)
                                } else {
                                  if (grade_ai_people[grade_sort_arr[j + 1]]) {
                                    var leave_data = sort_grade_pep_clone[j + 1] - absence_pep
                                    sort_grade_pep_clone[j + 1] = leave_data;
                                    // return ; 
                                    /***/
                                    var temp_pep = grade_pep_clone[grade_sort_arr[j + 1]].slice(0, absence_pep);
                                    //将被前边借走的数据从栈里边删除
                                    grade_pep_clone[grade_sort_arr[j + 1]] = us.reject(grade_pep_clone[grade_sort_arr[j + 1]], function(temp) {
                                      return !!~temp_pep.indexOf(temp)
                                    })
                                    //从后边借来的**放回自己的栈里
                                    us.each(temp_pep, function(temp) {
                                      grade_pep_clone[grade_sort_arr[i]].push(temp)
                                    })
                                    /****/
                                    //后边没数据了，往前边拉几个    
                                  } else {
                                    var leave_data = sort_grade_pep_clone[j - 1] - absence_pep;
                                    sort_grade_pep_clone[j - 1] = leave_data;
                                    /***/
                                    var slice_len = grade_pep_clone[grade_sort_arr[j - 1]].length - absence_pep;
                                    var slice_first = grade_pep_clone[grade_sort_arr[j - 1]].length;
                                    var temp_pep = grade_pep_clone[grade_sort_arr[j - 1]].slice(slice_len, slice_first);
                                    //将被前边借走的数据从栈里边删除
                                    grade_pep_clone[grade_sort_arr[j - 1]] = us.reject(grade_pep_clone[grade_sort_arr[j - 1]], function(temp) {
                                      return !!~temp_pep.indexOf(temp)
                                    })
                                    //从后边借来的**放回自己的栈里 
                                    us.each(temp_pep, function(temp) {
                                      grade_pep_clone[grade_sort_arr[i]].push(temp)
                                    })
                                    /****/
                                  }
                                }

                              }
                            }
                          }

                        }
                        // console.log(sort_grade_pep_clone); 
                        console.log(grade_pep_clone['A'].length + 'length1');
                        console.log(grade_pep_clone['B'].length + 'length1');
                        console.log(grade_pep_clone['C'].length + 'length1');
                        console.log(grade_pep_clone['D'].length + 'length1');
                        console.log(grade_pep_clone['E'].length + 'length1');
                        // console.log(grade_pep_clone['A']); 
                        async.times(grade_sort_arr.length, function(n, next) {
                          var grade_sort_arr_single = grade_sort_arr[n];
                          var assessment_id_arr = grade_pep_clone[grade_sort_arr_single];
                          if (assessment_id_arr.length > 0) {
                            async.times(assessment_id_arr.length, function(n, next) {
                              var assessment_id = assessment_id_arr[n];
                              var update_data = {
                                ai_forced_distribution_grade: grade_sort_arr_single
                              }
                              AssessmentInstance.findByIdAndUpdate(assessment_id, update_data, function(err, result) {
                                // console.log(result.ai_forced_distribution_grade);
                                next(null, result)
                              })
                            }, next)
                          } else {
                            next(null, null)
                          }

                        }, next)

                      }, function(err, result) {
                        cb(null, result)
                      })
                    }
                  }, function(err, result) {
                    cb(null, result)
                  })
                  break;
                case 'C':
                  async.parallel({
                    manager_data: function(cb) {
                      if (force_is_manager_group == 'E') {
                        //同一上级管理者（公司）
                        get_manager_position_e(position_man, ou_position_manager, force_data_single, E_data_pep_len, E_data_pep_id, grade_sort_arr, function(data) {
                          cb(null, data)
                        })
                      } else {
                        //自定义管理者分组
                        var group_data_clone = us.clone(group_data);
                        get_manager_position_f(group_data_clone, grade_data_sort, grade_sort_arr, assess_group_pos_key, assess_group_pos, force_data_single, position_manager, function(data) {
                          cb(null, data)
                        })
                      }
                    },
                    ou_data: function(cb) {
                      //循环每一个分组，落在分组间的公司将进行强制分布
                      async.times(ou_group_key.length, function(n, next) {
                        var group_com = ou_group_key[n];
                        var ou_group_len = ou_group[group_com].length;
                        var rule_force = us.filter(force_data_single, function(temp) {
                          return temp.pep_low_value <= ou_group_len && temp.pep_high_value >= ou_group_len;
                        })
                        var E_pep_len = us.values(E_data_pep_len_ou[group_com]);
                        var E_pep_id = E_data_pep_id_ou[group_com];
                        var sort_grade_pep_clone = us.clone(E_pep_len);
                        var grade_pep_clone = us.clone(E_pep_id);
                        // console.log(grade_ai_people_sort);
                        //在for循环里递归,最终要的是递归之后返回的值如何继续运用到后续的循环中去
                        var grade_sort_arr_clone_len = grade_sort_arr.length;
                        for (var i = 0; i < grade_sort_arr.length; i++) {
                          var grade_rule_match = us.find(rule_force, function(rule) {
                            return rule.grade_name == grade_sort_arr[i]
                          })
                          var force_scale = grade_rule_match ? grade_rule_match.force_scale : ''
                          //sort_grade_pep_clone[i + 1]  == grade_ai_people[grade_sort_arr[i]]
                          if (force_scale == '2') {
                            var force_pep_value = grade_rule_match ? grade_rule_match.force_pep_value : '';
                            //对强制分布值和其实际等级人数值进行比较
                            if (force_pep_value <= sort_grade_pep_clone[i]) {
                              //多出来的数据
                              var leave_data = sort_grade_pep_clone[i] - force_pep_value;
                              sort_grade_pep_clone[i] = force_pep_value;
                              //将多出来的挤到数组后边去
                              sort_grade_pep_clone[i + 1] += leave_data;
                              /***/
                              var slice_len = grade_pep_clone[grade_sort_arr[i]].length - leave_data;
                              var slice_first = grade_pep_clone[grade_sort_arr[i]].length;
                              var temp_pep = grade_pep_clone[grade_sort_arr[i]].slice(slice_len, slice_first);
                              //将被前边借走的数据从栈里边删除
                              grade_pep_clone[grade_sort_arr[i]] = us.reject(grade_pep_clone[grade_sort_arr[j + 1]], function(temp) {
                                return !!~temp_pep.indexOf(temp)
                              })
                              //从后边借来的**放回自己的栈里
                              us.each(temp_pep, function(temp) {
                                grade_pep_clone[grade_sort_arr[i + 1]].push(temp)
                              })
                              /**/
                              //人的递归及排序--不太好操作，人员无法排序，所以在后面再重新组装
                            } else {

                              var absence_pep = force_pep_value - sort_grade_pep_clone[i];
                              //不够的人数，从后面抽取
                              //直接赋给一个变量得不到值，需先调用函数，再赋值。
                              //调用了两次才能得到值.
                              sort_grade_pep_clone[i] = force_pep_value;
                              //克隆一份初始数据,不能直接赋值操作(可以直接赋值操作，只不过前面我的赋值操作是在递归调用之后);
                              var j = i;
                              get_data(absence_pep)
                              //recursion function

                              function get_data(absence_pep) {
                                if (grade_pep_clone[grade_sort_arr[j + 1]] < absence_pep) {
                                  absence_pep = absence_pep - sort_grade_pep_clone[j + 1];
                                  sort_grade_pep_clone[j + 1] = 0;
                                  /****/
                                  var temp_pep = grade_pep_clone[grade_sort_arr[j + 1]].slice(0, absence_pep);
                                  //将被前边借走的数据从栈里边删除
                                  grade_pep_clone[grade_sort_arr[j + 1]] = us.reject(grade_pep_clone[grade_sort_arr[j + 1]], function(temp) {
                                    return !!~temp_pep.indexOf(temp)
                                  })
                                  //从后边借来的**放回自己的栈里
                                  us.each(temp_pep, function(temp) {
                                    grade_pep_clone[grade_sort_arr[i]].push(temp)
                                  })
                                  /****/
                                  j++;
                                  get_data(absence_pep)
                                } else {
                                  if (grade_pep_clone[grade_sort_arr[j + 1]]) {
                                    var leave_data = sort_grade_pep_clone[j + 1] - absence_pep;

                                    sort_grade_pep_clone[j + 1] = leave_data;

                                    /***/
                                    var temp_pep = grade_pep_clone[grade_sort_arr[j + 1]].slice(0, absence_pep);
                                    //将被前边借走的数据从栈里边删除
                                    grade_pep_clone[grade_sort_arr[j + 1]] = us.reject(grade_pep_clone[grade_sort_arr[j + 1]], function(temp) {
                                      return !!~temp_pep.indexOf(temp)
                                    })
                                    //从后边借来的**放回自己的栈里
                                    us.each(temp_pep, function(temp) {
                                      grade_pep_clone[grade_sort_arr[i]].push(temp)
                                    })
                                    /****/
                                  } else {
                                    //后边没数据了，往前边拉几个过来
                                    var leave_data = sort_grade_pep_clone[j - 1] - absence_pep;
                                    sort_grade_pep_clone[j - 1] = leave_data;
                                    /***/
                                    var slice_len = grade_pep_clone[grade_sort_arr[j - 1]].length - leave_data;
                                    var slice_first = grade_pep_clone[grade_sort_arr[j - 1]].length;
                                    var temp_pep = grade_pep_clone[grade_sort_arr[j - 1]].slice(slice_len, slice_first);
                                    //将被前边借走的数据从栈里边删除
                                    grade_pep_clone[grade_sort_arr[j - 1]] = us.reject(grade_pep_clone[grade_sort_arr[j - 1]], function(temp) {
                                      return !!~temp_pep.indexOf(temp)
                                    })
                                    //从后边借来的**放回自己的栈里
                                    us.each(temp_pep, function(temp) {
                                      grade_pep_clone[grade_sort_arr[i]].push(temp)
                                    })
                                    /****/
                                  }
                                  // return ;     
                                }
                              }
                            }
                          } else {
                            var force_pep_value = grade_rule_match.force_pep_value ? grade_rule_match.force_pep_value : '';
                            if (force_pep_value <= sort_grade_pep_clone[i]) {
                              //多出来的数据,也全部给她----即强制分布后的值不变,因为它自己已经足够不需要从别处借
                              sort_grade_pep_clone[i] = sort_grade_pep_clone[i];
                            } else {
                              //因为是要>=，不够了当然要从后边的借,算法和前边<=是相同的不够就从后面去借
                              var absence_pep = force_pep_value - sort_grade_pep_clone[i];
                              //不够的人数，从后面抽取
                              //直接赋给一个变量得不到值，需先调用函数，再赋值。
                              //调用了两次才能得到值.
                              sort_grade_pep_clone[i] = force_pep_value;
                              //克隆一份初始数据,不能直接赋值操作(可以直接赋值操作，只不过前面我的赋值操作是在递归调用之后);
                              var j = i;
                              get_datas(absence_pep)
                              //recursion function
                              function get_datas(absence_pep) {
                                //判断后边是否还有数据，没有则不递归了

                                if (grade_pep_clone[grade_sort_arr[j + 1]] < absence_pep) {
                                  absence_pep = absence_pep - sort_grade_pep_clone[j + 1];
                                  sort_grade_pep_clone[j + 1] = 0;
                                  /****/
                                  var temp_pep = grade_pep_clone[grade_sort_arr[j + 1]].slice(0, absence_pep);
                                  //将被前边借走的数据从栈里边删除
                                  grade_pep_clone[grade_sort_arr[j + 1]] = us.reject(grade_pep_clone[grade_sort_arr[j + 1]], function(temp) {
                                    return !!~temp_pep.indexOf(temp)
                                  })
                                  //从后边借来的**放回自己的栈里
                                  us.each(temp_pep, function(temp) {
                                    grade_pep_clone[grade_sort_arr[i]].push(temp)
                                  })
                                  /****/
                                  j++;
                                  get_datas(absence_pep)
                                } else {
                                  if (grade_pep_clone[grade_sort_arr[j + 1]]) {
                                    var leave_data = sort_grade_pep_clone[j + 1] - absence_pep
                                    sort_grade_pep_clone[j + 1] = leave_data;
                                    // return ; 
                                    /***/
                                    var temp_pep = grade_pep_clone[grade_sort_arr[j + 1]].slice(0, absence_pep);
                                    //将被前边借走的数据从栈里边删除
                                    grade_pep_clone[grade_sort_arr[j + 1]] = us.reject(grade_pep_clone[grade_sort_arr[j + 1]], function(temp) {
                                      return !!~temp_pep.indexOf(temp)
                                    })
                                    //从后边借来的**放回自己的栈里
                                    us.each(temp_pep, function(temp) {
                                      grade_pep_clone[grade_sort_arr[i]].push(temp)
                                    })
                                    /****/
                                    //后边没数据了，往前边拉几个    
                                  } else {
                                    var leave_data = sort_grade_pep_clone[j - 1] - absence_pep;
                                    sort_grade_pep_clone[j - 1] = leave_data;
                                    /***/
                                    var slice_len = grade_pep_clone[grade_sort_arr[j - 1]].length - absence_pep;
                                    var slice_first = grade_pep_clone[grade_sort_arr[j - 1]].length;
                                    var temp_pep = grade_pep_clone[grade_sort_arr[j - 1]].slice(slice_len, slice_first);
                                    //将被前边借走的数据从栈里边删除
                                    grade_pep_clone[grade_sort_arr[j - 1]] = us.reject(grade_pep_clone[grade_sort_arr[j - 1]], function(temp) {
                                      return !!~temp_pep.indexOf(temp)
                                    })
                                    //从后边借来的**放回自己的栈里 
                                    us.each(temp_pep, function(temp) {
                                      grade_pep_clone[grade_sort_arr[i]].push(temp)
                                    })
                                    /****/
                                  }
                                }

                              }
                            }
                          }

                        }
                        console.log(grade_pep_clone['A'].length + 'length1');
                        console.log(grade_pep_clone['B'].length + 'length1');
                        console.log(grade_pep_clone['C'].length + 'length1');
                        console.log(grade_pep_clone['D'].length + 'length1');
                        console.log(grade_pep_clone['E'].length + 'length1');
                        // console.log(grade_pep_clone['A']);
                        async.times(grade_sort_arr.length, function(n, next) {
                          var grade_sort_arr_single = grade_sort_arr[n];
                          var assessment_id_arr = grade_pep_clone[grade_sort_arr_single];
                          if (assessment_id_arr.length > 0) {
                            async.times(assessment_id_arr.length, function(n, next) {
                              var assessment_id = assessment_id_arr[n];
                              var update_data = {
                                ai_forced_distribution_grade: grade_sort_arr_single
                              }
                              AssessmentInstance.findByIdAndUpdate(assessment_id, update_data, function(err, result) {
                                // console.log(result.ai_forced_distribution_grade);
                                next(null, result)
                              })
                            }, next)
                          }

                        }, next)

                      }, function(err, result) {
                        cb(null, result)
                      })
                    }
                  }, function(err, result) {
                    cb(null, result)
                  })
                  break;
                case 'D':
                  async.parallel({
                    manager_data: function(cb) {
                      // get_manager_position(req, res, function(data) {
                      //   cb(null, data)
                      // })
                      if (force_is_manager_group == 'E') {
                        //同一上级管理者（公司）
                        get_manager_position_e(position_man, ou_position_manager, force_data_single, E_data_pep_len, E_data_pep_id, grade_sort_arr, function(data) {
                          cb(null, data)
                        })

                      } else {
                        //自定义管理者分组
                        var group_data_clone = us.clone(group_data);
                        get_manager_position_f(group_data_clone, grade_data_sort, grade_sort_arr, assess_group_pos_key, assess_group_pos, force_data_single, position_manager, function(data) {
                          cb(null, data)
                        })
                      }
                    },
                    ou_data: function(cb) {
                      //循环每一个分组，落在分组间的公司将进行强制分布
                      var group_data_clone = us.clone(group_data);
                      async.times(group_data_clone.length, function(n, next) {
                        var group_ou = group_data_clone[n].organizations;
                        var force_ou = us.filter(assess_group_ou_key, function(temp) {
                          return !!~group_ou.indexOf(temp)
                        })

                        var pep = 0;
                        us.each(force_ou, function(temp) {
                          pep += assess_group_ou[temp];
                        })
                        // var rule_data_single = us.find(rule_data, function(temp) {
                        //   return us.isEqual(temp.id, String(force_rule))
                        // })
                        // var force_data_single = rule_data_single ? rule_data_single.force_data : '';
                        var rule_force = us.filter(force_data_single, function(temp) {
                          return temp.pep_low_value <= pep && temp.pep_high_value >= pep;
                        })
                        var in_position_manager_filter = us.filter(in_position_manager, function(temp) {
                          return !!~group_ou.indexOf(temp.ou)
                        })
                        //取排序后的数据
                        var in_position_manager_sort = us.sortBy(in_position_manager_filter, function(pre, next) {
                          return next - pre
                        })
                        var grade_ai_score = {}, grade_ai_people = {}, grade_ai_people_sort = {};
                        us.each(grade_data_sort, function(grade) {
                          //自定义公司组
                          var group_data = us.filter(in_position_manager_sort, function(temp) {
                            return temp.ai_score >= grade.grade_low_value && temp.ai_score <= grade.grade_high_value
                          })
                          grade_ai_score[grade.grade_name] = group_data;
                          grade_ai_people[grade.grade_name] = group_data.length;
                          //将等级对应的人,按得分排序后放到数组里,后面第二次递归的时候需用到
                          var group_data_sort = us.sortBy(group_data, function(prev, next) {
                            return next - prev
                          })
                          var pep_arr = [],
                            pep_score = [];
                          us.each(group_data_sort, function(temp) {

                            //把人换成ID,ID唯一，people不一定唯一
                            // pep_arr.push(temp.people)
                            pep_arr.push(temp.id)
                            pep_score.push(temp.ai_score)
                          })
                          grade_ai_people_sort[grade.grade_name] = pep_arr;

                          // console.log(grade.grade_name);  
                          // return grade_name
                        })
                        //取排序后的等级对应人数值，并clone一份备用 ---公司的
                        var sort_grade_pep = us.values(grade_ai_people);
                        var sort_grade_pep_clone = us.clone(sort_grade_pep);
                        var grade_pep_clone = us.clone(grade_ai_people_sort);
                        // console.log(grade_ai_people_sort);
                        //在for循环里递归,最终要的是递归之后返回的值如何继续运用到后续的循环中去
                        var grade_sort_arr_clone_len = grade_sort_arr.length;
                        console.log(sort_grade_pep_clone);
                        for (var i = 0; i < grade_sort_arr.length; i++) {
                          var grade_rule_match = us.find(rule_force, function(rule) {
                            return rule.grade_name == grade_sort_arr[i]
                          })
                          var force_scale = grade_rule_match ? grade_rule_match.force_scale : ''
                          //sort_grade_pep_clone[i + 1]  == grade_ai_people[grade_sort_arr[i]]
                          if (force_scale == '2') {
                            var force_pep_value = grade_rule_match ? grade_rule_match.force_pep_value : '';
                            //对强制分布值和其实际等级人数值进行比较
                            if (force_pep_value <= sort_grade_pep_clone[i]) {
                              //多出来的数据
                              var leave_data = sort_grade_pep_clone[i] - force_pep_value;
                              sort_grade_pep_clone[i] = force_pep_value;
                              //将多出来的挤到数组后边去
                              sort_grade_pep_clone[i + 1] += leave_data;
                              /***/
                              var slice_len = grade_pep_clone[grade_sort_arr[i]].length - leave_data;
                              var slice_first = grade_pep_clone[grade_sort_arr[i]].length;
                              var temp_pep = grade_pep_clone[grade_sort_arr[i]].slice(slice_len, slice_first);
                              //将被前边借走的数据从栈里边删除
                              grade_pep_clone[grade_sort_arr[i]] = us.reject(grade_pep_clone[grade_sort_arr[j + 1]], function(temp) {
                                return !!~temp_pep.indexOf(temp)
                              })
                              //从后边借来的**放回自己的栈里
                              us.each(temp_pep, function(temp) {
                                grade_pep_clone[grade_sort_arr[i + 1]].push(temp)
                              })
                              /**/
                              //人的递归及排序--不太好操作，人员无法排序，所以在后面再重新组装
                            } else {
                              var absence_pep = force_pep_value - sort_grade_pep_clone[i];
                              //不够的人数，从后面抽取
                              //直接赋给一个变量得不到值，需先调用函数，再赋值。
                              //调用了两次才能得到值.
                              sort_grade_pep_clone[i] = force_pep_value;
                              //克隆一份初始数据,不能直接赋值操作(可以直接赋值操作，只不过前面我的赋值操作是在递归调用之后);
                              var j = i;
                              get_data(absence_pep)
                              //recursion function

                              function get_data(absence_pep) {
                                if (grade_ai_people[grade_sort_arr[j + 1]] < absence_pep) {
                                  absence_pep = absence_pep - sort_grade_pep_clone[j + 1];
                                  sort_grade_pep_clone[j + 1] = 0;
                                  /****/
                                  var temp_pep = grade_pep_clone[grade_sort_arr[j + 1]].slice(0, absence_pep);
                                  //将被前边借走的数据从栈里边删除
                                  grade_pep_clone[grade_sort_arr[j + 1]] = us.reject(grade_pep_clone[grade_sort_arr[j + 1]], function(temp) {
                                    return !!~temp_pep.indexOf(temp)
                                  })
                                  //从后边借来的**放回自己的栈里
                                  us.each(temp_pep, function(temp) {
                                    grade_pep_clone[grade_sort_arr[i]].push(temp)
                                  })
                                  /****/
                                  j++;
                                  get_data(absence_pep)
                                } else {
                                  if (grade_ai_people[grade_sort_arr[j + 1]]) {
                                    var leave_data = sort_grade_pep_clone[j + 1] - absence_pep;

                                    sort_grade_pep_clone[j + 1] = leave_data;

                                    /***/
                                    var temp_pep = grade_pep_clone[grade_sort_arr[j + 1]].slice(0, absence_pep);
                                    //将被前边借走的数据从栈里边删除
                                    grade_pep_clone[grade_sort_arr[j + 1]] = us.reject(grade_pep_clone[grade_sort_arr[j + 1]], function(temp) {
                                      return !!~temp_pep.indexOf(temp)
                                    })
                                    //从后边借来的**放回自己的栈里
                                    us.each(temp_pep, function(temp) {
                                      grade_pep_clone[grade_sort_arr[i]].push(temp)
                                    })
                                    /****/
                                  } else {
                                    //后边没数据了，往前边拉几个过来
                                    var leave_data = sort_grade_pep_clone[j - 1] - absence_pep;
                                    sort_grade_pep_clone[j - 1] = leave_data;
                                    /***/
                                    var slice_len = grade_pep_clone[grade_sort_arr[j - 1]].length - leave_data;
                                    var slice_first = grade_pep_clone[grade_sort_arr[j - 1]].length;
                                    var temp_pep = grade_pep_clone[grade_sort_arr[j - 1]].slice(slice_len, slice_first);
                                    //将被前边借走的数据从栈里边删除
                                    grade_pep_clone[grade_sort_arr[j - 1]] = us.reject(grade_pep_clone[grade_sort_arr[j - 1]], function(temp) {
                                      return !!~temp_pep.indexOf(temp)
                                    })
                                    //从后边借来的**放回自己的栈里
                                    us.each(temp_pep, function(temp) {
                                      grade_pep_clone[grade_sort_arr[i]].push(temp)
                                    })
                                    /****/
                                  }
                                  // return ;     
                                }
                              }
                            }
                          } else {
                            var force_pep_value = grade_rule_match.force_pep_value ? grade_rule_match.force_pep_value : '';
                            if (force_pep_value <= sort_grade_pep_clone[i]) {
                              //多出来的数据,也全部给她----即强制分布后的值不变,因为它自己已经足够不需要从别处借
                              sort_grade_pep_clone[i] = sort_grade_pep_clone[i];
                            } else {
                              //因为是要>=，不够了当然要从后边的借,算法和前边<=是相同的不够就从后面去借
                              var absence_pep = force_pep_value - sort_grade_pep_clone[i];
                              //不够的人数，从后面抽取
                              //直接赋给一个变量得不到值，需先调用函数，再赋值。
                              //调用了两次才能得到值.
                              sort_grade_pep_clone[i] = force_pep_value;
                              //克隆一份初始数据,不能直接赋值操作(可以直接赋值操作，只不过前面我的赋值操作是在递归调用之后);
                              var j = i;
                              get_datas(absence_pep)
                              //recursion function
                              function get_datas(absence_pep) {
                                //判断后边是否还有数据，没有则不递归了

                                if (grade_ai_people[grade_sort_arr[j + 1]] < absence_pep) {
                                  absence_pep = absence_pep - sort_grade_pep_clone[j + 1];
                                  sort_grade_pep_clone[j + 1] = 0;
                                  /****/
                                  var temp_pep = grade_pep_clone[grade_sort_arr[j + 1]].slice(0, absence_pep);
                                  //将被前边借走的数据从栈里边删除
                                  grade_pep_clone[grade_sort_arr[j + 1]] = us.reject(grade_pep_clone[grade_sort_arr[j + 1]], function(temp) {
                                    return !!~temp_pep.indexOf(temp)
                                  })
                                  //从后边借来的**放回自己的栈里
                                  us.each(temp_pep, function(temp) {
                                    grade_pep_clone[grade_sort_arr[i]].push(temp)
                                  })
                                  /****/
                                  j++;
                                  get_datas(absence_pep)
                                } else {
                                  if (grade_ai_people[grade_sort_arr[j + 1]]) {
                                    var leave_data = sort_grade_pep_clone[j + 1] - absence_pep
                                    sort_grade_pep_clone[j + 1] = leave_data;
                                    // return ; 
                                    /***/
                                    var temp_pep = grade_pep_clone[grade_sort_arr[j + 1]].slice(0, absence_pep);
                                    //将被前边借走的数据从栈里边删除
                                    grade_pep_clone[grade_sort_arr[j + 1]] = us.reject(grade_pep_clone[grade_sort_arr[j + 1]], function(temp) {
                                      return !!~temp_pep.indexOf(temp)
                                    })
                                    //从后边借来的**放回自己的栈里
                                    us.each(temp_pep, function(temp) {
                                      grade_pep_clone[grade_sort_arr[i]].push(temp)
                                    })
                                    /****/
                                    //后边没数据了，往前边拉几个    
                                  } else {
                                    var leave_data = sort_grade_pep_clone[j - 1] - absence_pep;
                                    sort_grade_pep_clone[j - 1] = leave_data;
                                    /***/
                                    var slice_len = grade_pep_clone[grade_sort_arr[j - 1]].length - absence_pep;
                                    var slice_first = grade_pep_clone[grade_sort_arr[j - 1]].length;
                                    var temp_pep = grade_pep_clone[grade_sort_arr[j - 1]].slice(slice_len, slice_first);
                                    //将被前边借走的数据从栈里边删除
                                    grade_pep_clone[grade_sort_arr[j - 1]] = us.reject(grade_pep_clone[grade_sort_arr[j - 1]], function(temp) {
                                      return !!~temp_pep.indexOf(temp)
                                    })
                                    //从后边借来的**放回自己的栈里 
                                    us.each(temp_pep, function(temp) {
                                      grade_pep_clone[grade_sort_arr[i]].push(temp)
                                    })
                                    /****/
                                  }
                                }

                              }
                            }
                          }

                        }
                        // console.log(sort_grade_pep_clone); 
                        console.log(grade_pep_clone['A'].length + 'length1');
                        console.log(grade_pep_clone['B'].length + 'length1');
                        console.log(grade_pep_clone['C'].length + 'length1');
                        console.log(grade_pep_clone['D'].length + 'length1');
                        console.log(grade_pep_clone['E'].length + 'length1');
                        // console.log(grade_pep_clone['A']); 
                        async.times(grade_sort_arr.length, function(n, next) {
                          var grade_sort_arr_single = grade_sort_arr[n];
                          var assessment_id_arr = grade_pep_clone[grade_sort_arr_single];
                          if (assessment_id_arr.length > 0) {
                            async.times(assessment_id_arr.length, function(n, next) {
                              var assessment_id = assessment_id_arr[n];
                              var update_data = {
                                ai_forced_distribution_grade: grade_sort_arr_single
                              }
                              AssessmentInstance.findByIdAndUpdate(assessment_id, update_data, function(err, result) {
                                // console.log(result.ai_forced_distribution_grade);
                                next(null, result)
                              })
                            }, next)
                          } else {
                            next(null, null)
                          }

                        }, next)

                      }, function(err, result) {
                        cb(null, result)
                      })
                    }
                  }, function(err, result) {
                    cb(null, result)
                  })
                  break;
              }

            } else {
              switch (force_algorithm) {
                case 'A':
                  //循环每一个分组，落在分组间的公司将进行强制分布
                  async.times(com_group_key_all.length, function(n, next) {
                    var group_com = com_group_key_all[n];
                    var com_group_len = com_group_all[group_com].length;
                    var rule_force = us.filter(force_data_single, function(temp) {
                      return temp.pep_low_value <= com_group_len && temp.pep_high_value >= com_group_len;
                    })
                    var E_pep_len = us.values(E_data_pep_len_com_all[group_com]);
                    var E_pep_id = E_data_pep_id_com_all[group_com];
                    var sort_grade_pep_clone = us.clone(E_pep_len);
                    var grade_pep_clone = us.clone(E_pep_id);
                    // console.log(grade_ai_people_sort);
                    //在for循环里递归,最终要的是递归之后返回的值如何继续运用到后续的循环中去
                    var grade_sort_arr_clone_len = grade_sort_arr.length;
                    for (var i = 0; i < grade_sort_arr.length; i++) {
                      var grade_rule_match = us.find(rule_force, function(rule) {
                        return rule.grade_name == grade_sort_arr[i]
                      })
                      //sort_grade_pep_clone[i + 1]  == grade_ai_people[grade_sort_arr[i]]
                      if (grade_rule_match.force_scale == '2') {
                        var force_pep_value = grade_rule_match.force_pep_value ? grade_rule_match.force_pep_value : '';
                        //对强制分布值和其实际等级人数值进行比较
                        if (force_pep_value <= sort_grade_pep_clone[i]) {
                          //多出来的数据
                          var leave_data = sort_grade_pep_clone[i] - force_pep_value;
                          sort_grade_pep_clone[i] = force_pep_value;
                          //将多出来的挤到数组后边去
                          sort_grade_pep_clone[i + 1] += leave_data;
                          /***/
                          var slice_len = grade_pep_clone[grade_sort_arr[i]].length - leave_data;
                          var slice_first = grade_pep_clone[grade_sort_arr[i]].length;
                          var temp_pep = grade_pep_clone[grade_sort_arr[i]].slice(slice_len, slice_first);
                          //将被前边借走的数据从栈里边删除
                          grade_pep_clone[grade_sort_arr[i]] = us.reject(grade_pep_clone[grade_sort_arr[j + 1]], function(temp) {
                            return !!~temp_pep.indexOf(temp)
                          })
                          //从后边借来的**放回自己的栈里
                          us.each(temp_pep, function(temp) {
                            grade_pep_clone[grade_sort_arr[i + 1]].push(temp)
                          })
                          /**/
                          //人的递归及排序--不太好操作，人员无法排序，所以在后面再重新组装
                        } else {

                          var absence_pep = force_pep_value - sort_grade_pep_clone[i];
                          //不够的人数，从后面抽取
                          //直接赋给一个变量得不到值，需先调用函数，再赋值。
                          //调用了两次才能得到值.
                          sort_grade_pep_clone[i] = force_pep_value;
                          //克隆一份初始数据,不能直接赋值操作(可以直接赋值操作，只不过前面我的赋值操作是在递归调用之后);
                          var j = i;
                          get_data(absence_pep)
                          //recursion function

                          function get_data(absence_pep) {
                            if (grade_pep_clone[grade_sort_arr[j + 1]] < absence_pep) {
                              absence_pep = absence_pep - sort_grade_pep_clone[j + 1];
                              sort_grade_pep_clone[j + 1] = 0;
                              /****/
                              var temp_pep = grade_pep_clone[grade_sort_arr[j + 1]].slice(0, absence_pep);
                              //将被前边借走的数据从栈里边删除
                              grade_pep_clone[grade_sort_arr[j + 1]] = us.reject(grade_pep_clone[grade_sort_arr[j + 1]], function(temp) {
                                return !!~temp_pep.indexOf(temp)
                              })
                              //从后边借来的**放回自己的栈里
                              us.each(temp_pep, function(temp) {
                                grade_pep_clone[grade_sort_arr[i]].push(temp)
                              })
                              /****/
                              j++;
                              get_data(absence_pep)
                            } else {
                              if (grade_pep_clone[grade_sort_arr[j + 1]]) {
                                var leave_data = sort_grade_pep_clone[j + 1] - absence_pep;

                                sort_grade_pep_clone[j + 1] = leave_data;

                                /***/
                                var temp_pep = grade_pep_clone[grade_sort_arr[j + 1]].slice(0, absence_pep);
                                //将被前边借走的数据从栈里边删除
                                grade_pep_clone[grade_sort_arr[j + 1]] = us.reject(grade_pep_clone[grade_sort_arr[j + 1]], function(temp) {
                                  return !!~temp_pep.indexOf(temp)
                                })
                                //从后边借来的**放回自己的栈里
                                us.each(temp_pep, function(temp) {
                                  grade_pep_clone[grade_sort_arr[i]].push(temp)
                                })
                                /****/
                              } else {
                                //后边没数据了，往前边拉几个过来
                                var leave_data = sort_grade_pep_clone[j - 1] - absence_pep;
                                sort_grade_pep_clone[j - 1] = leave_data;
                                /***/
                                var slice_len = grade_pep_clone[grade_sort_arr[j - 1]].length - leave_data;
                                var slice_first = grade_pep_clone[grade_sort_arr[j - 1]].length;
                                var temp_pep = grade_pep_clone[grade_sort_arr[j - 1]].slice(slice_len, slice_first);
                                //将被前边借走的数据从栈里边删除
                                grade_pep_clone[grade_sort_arr[j - 1]] = us.reject(grade_pep_clone[grade_sort_arr[j - 1]], function(temp) {
                                  return !!~temp_pep.indexOf(temp)
                                })
                                //从后边借来的**放回自己的栈里
                                us.each(temp_pep, function(temp) {
                                  grade_pep_clone[grade_sort_arr[i]].push(temp)
                                })
                                /****/
                              }
                              // return ;     
                            }
                          }
                        }
                      } else {
                        var force_pep_value = grade_rule_match.force_pep_value ? grade_rule_match.force_pep_value : '';
                        if (force_pep_value <= sort_grade_pep_clone[i]) {
                          //多出来的数据,也全部给她----即强制分布后的值不变,因为它自己已经足够不需要从别处借
                          sort_grade_pep_clone[i] = sort_grade_pep_clone[i];
                        } else {
                          //因为是要>=，不够了当然要从后边的借,算法和前边<=是相同的不够就从后面去借
                          var absence_pep = force_pep_value - sort_grade_pep_clone[i];
                          //不够的人数，从后面抽取
                          //直接赋给一个变量得不到值，需先调用函数，再赋值。
                          //调用了两次才能得到值.
                          sort_grade_pep_clone[i] = force_pep_value;
                          //克隆一份初始数据,不能直接赋值操作(可以直接赋值操作，只不过前面我的赋值操作是在递归调用之后);
                          var j = i;
                          get_datas(absence_pep)
                          //recursion function
                          function get_datas(absence_pep) {
                            //判断后边是否还有数据，没有则不递归了

                            if (grade_pep_clone[grade_sort_arr[j + 1]] < absence_pep) {
                              absence_pep = absence_pep - sort_grade_pep_clone[j + 1];
                              sort_grade_pep_clone[j + 1] = 0;
                              /****/
                              var temp_pep = grade_pep_clone[grade_sort_arr[j + 1]].slice(0, absence_pep);
                              //将被前边借走的数据从栈里边删除
                              grade_pep_clone[grade_sort_arr[j + 1]] = us.reject(grade_pep_clone[grade_sort_arr[j + 1]], function(temp) {
                                return !!~temp_pep.indexOf(temp)
                              })
                              //从后边借来的**放回自己的栈里
                              us.each(temp_pep, function(temp) {
                                grade_pep_clone[grade_sort_arr[i]].push(temp)
                              })
                              /****/
                              j++;
                              get_datas(absence_pep)
                            } else {
                              if (grade_pep_clone[grade_sort_arr[j + 1]]) {
                                var leave_data = sort_grade_pep_clone[j + 1] - absence_pep
                                sort_grade_pep_clone[j + 1] = leave_data;
                                // return ; 
                                /***/
                                var temp_pep = grade_pep_clone[grade_sort_arr[j + 1]].slice(0, absence_pep);
                                //将被前边借走的数据从栈里边删除
                                grade_pep_clone[grade_sort_arr[j + 1]] = us.reject(grade_pep_clone[grade_sort_arr[j + 1]], function(temp) {
                                  return !!~temp_pep.indexOf(temp)
                                })
                                //从后边借来的**放回自己的栈里
                                us.each(temp_pep, function(temp) {
                                  grade_pep_clone[grade_sort_arr[i]].push(temp)
                                })
                                /****/
                                //后边没数据了，往前边拉几个    
                              } else {
                                var leave_data = sort_grade_pep_clone[j - 1] - absence_pep;
                                sort_grade_pep_clone[j - 1] = leave_data;
                                /***/
                                var slice_len = grade_pep_clone[grade_sort_arr[j - 1]].length - absence_pep;
                                var slice_first = grade_pep_clone[grade_sort_arr[j - 1]].length;
                                var temp_pep = grade_pep_clone[grade_sort_arr[j - 1]].slice(slice_len, slice_first);
                                //将被前边借走的数据从栈里边删除
                                grade_pep_clone[grade_sort_arr[j - 1]] = us.reject(grade_pep_clone[grade_sort_arr[j - 1]], function(temp) {
                                  return !!~temp_pep.indexOf(temp)
                                })
                                //从后边借来的**放回自己的栈里 
                                us.each(temp_pep, function(temp) {
                                  grade_pep_clone[grade_sort_arr[i]].push(temp)
                                })
                                /****/
                              }
                            }

                          }
                        }
                      }

                    }
                    console.log(grade_pep_clone['A'].length + 'length1');
                    console.log(grade_pep_clone['B'].length + 'length1');
                    console.log(grade_pep_clone['C'].length + 'length1');
                    console.log(grade_pep_clone['D'].length + 'length1');
                    console.log(grade_pep_clone['E'].length + 'length1');
                    // console.log(grade_pep_clone['A']);
                    async.times(grade_sort_arr.length, function(n, next) {
                      var grade_sort_arr_single = grade_sort_arr[n];
                      var assessment_id_arr = grade_pep_clone[grade_sort_arr_single];
                      if (assessment_id_arr.length > 0) {
                        async.times(assessment_id_arr.length, function(n, next) {
                          var assessment_id = assessment_id_arr[n];
                          var update_data = {
                            ai_forced_distribution_grade: grade_sort_arr_single
                          }
                          AssessmentInstance.findByIdAndUpdate(assessment_id, update_data, function(err, result) {
                            // console.log(result.ai_forced_distribution_grade);
                            next(null, result)
                          })
                        }, next)
                      } else {
                        next(null, null)
                      }

                    }, next)

                  }, function(err, result) {
                    cb(null, result)
                  })
                  break;
                case 'B':
                  //循环每一个分组，落在分组间的公司将进行强制分布
                  var group_data_clone = us.clone(group_data);
                  async.times(group_data_clone.length, function(n, next) {
                    var group_com = group_data_clone[n].companies;
                    var force_company = us.filter(assess_group_com_key_all, function(temp) {
                      return !!~group_com.indexOf(temp)
                    })
                    var pep = 0;
                    us.each(force_company, function(temp) {
                      pep += assess_group_com_all[temp];
                    })
                    var rule_force = us.filter(force_data_single, function(temp) {
                      return temp.pep_low_value <= pep && temp.pep_high_value >= pep;
                    })
                    var force_assess_data_filter = us.filter(force_assess_data, function(temp) {
                      return !!~group_com.indexOf(temp.company)
                    })
                    //取排序后的数据
                    var force_assess_data_filter_sort = us.sortBy(force_assess_data_filter, function(pre, next) {
                      return next - pre
                    })
                    var grade_ai_score = {}, grade_ai_people = {}, grade_ai_people_sort = {};
                    us.each(grade_data_sort, function(grade) {
                      //自定义公司组
                      var group_data = us.filter(force_assess_data_filter_sort, function(temp) {
                        return temp.ai_score >= grade.grade_low_value && temp.ai_score <= grade.grade_high_value
                      })
                      grade_ai_score[grade.grade_name] = group_data;
                      grade_ai_people[grade.grade_name] = group_data.length;
                      //将等级对应的人,按得分排序后放到数组里,后面第二次递归的时候需用到
                      var group_data_sort = us.sortBy(group_data, function(prev, next) {
                        return next - prev
                      })
                      var pep_arr = [],
                        pep_score = [];
                      us.each(group_data_sort, function(temp) {

                        //把人换成ID,ID唯一，people不一定唯一
                        // pep_arr.push(temp.people)
                        pep_arr.push(temp.id)
                        pep_score.push(temp.ai_score)
                      })
                      grade_ai_people_sort[grade.grade_name] = pep_arr;

                      // console.log(grade.grade_name);  
                      // return grade_name
                    })
                    //取排序后的等级对应人数值，并clone一份备用 ---公司的
                    var sort_grade_pep = us.values(grade_ai_people);
                    var sort_grade_pep_clone = us.clone(sort_grade_pep);
                    var grade_pep_clone = us.clone(grade_ai_people_sort);
                    // console.log(grade_ai_people_sort);
                    //在for循环里递归,最终要的是递归之后返回的值如何继续运用到后续的循环中去
                    var grade_sort_arr_clone_len = grade_sort_arr.length;
                    for (var i = 0; i < grade_sort_arr.length; i++) {
                      var grade_rule_match = us.find(rule_force, function(rule) {
                        return rule.grade_name == grade_sort_arr[i]
                      })
                      var force_scale = grade_rule_match ? grade_rule_match.force_scale : ''
                      //sort_grade_pep_clone[i + 1]  == grade_ai_people[grade_sort_arr[i]]
                      if (force_scale == '2') {
                        var force_pep_value = grade_rule_match ? grade_rule_match.force_pep_value : '';
                        //对强制分布值和其实际等级人数值进行比较
                        if (force_pep_value <= sort_grade_pep_clone[i]) {
                          //多出来的数据
                          var leave_data = sort_grade_pep_clone[i] - force_pep_value;
                          sort_grade_pep_clone[i] = force_pep_value;
                          //将多出来的挤到数组后边去
                          sort_grade_pep_clone[i + 1] += leave_data;
                          /***/
                          var slice_len = grade_pep_clone[grade_sort_arr[i]].length - leave_data;
                          var slice_first = grade_pep_clone[grade_sort_arr[i]].length;
                          var temp_pep = grade_pep_clone[grade_sort_arr[i]].slice(slice_len, slice_first);
                          //将被前边借走的数据从栈里边删除
                          grade_pep_clone[grade_sort_arr[i]] = us.reject(grade_pep_clone[grade_sort_arr[j + 1]], function(temp) {
                            return !!~temp_pep.indexOf(temp)
                          })
                          //从后边借来的**放回自己的栈里
                          us.each(temp_pep, function(temp) {
                            grade_pep_clone[grade_sort_arr[i + 1]].push(temp)
                          })
                          /**/
                          //人的递归及排序--不太好操作，人员无法排序，所以在后面再重新组装
                        } else {
                          var absence_pep = force_pep_value - sort_grade_pep_clone[i];
                          //不够的人数，从后面抽取
                          //直接赋给一个变量得不到值，需先调用函数，再赋值。
                          //调用了两次才能得到值.
                          sort_grade_pep_clone[i] = force_pep_value;
                          //克隆一份初始数据,不能直接赋值操作(可以直接赋值操作，只不过前面我的赋值操作是在递归调用之后);
                          var j = i;
                          get_data(absence_pep)
                          //recursion function

                          function get_data(absence_pep) {
                            if (grade_ai_people[grade_sort_arr[j + 1]] < absence_pep) {
                              absence_pep = absence_pep - sort_grade_pep_clone[j + 1];
                              sort_grade_pep_clone[j + 1] = 0;
                              /****/
                              var temp_pep = grade_pep_clone[grade_sort_arr[j + 1]].slice(0, absence_pep);
                              //将被前边借走的数据从栈里边删除
                              grade_pep_clone[grade_sort_arr[j + 1]] = us.reject(grade_pep_clone[grade_sort_arr[j + 1]], function(temp) {
                                return !!~temp_pep.indexOf(temp)
                              })
                              //从后边借来的**放回自己的栈里
                              us.each(temp_pep, function(temp) {
                                grade_pep_clone[grade_sort_arr[i]].push(temp)
                              })
                              /****/
                              j++;
                              get_data(absence_pep)
                            } else {
                              if (grade_ai_people[grade_sort_arr[j + 1]]) {
                                var leave_data = sort_grade_pep_clone[j + 1] - absence_pep;

                                sort_grade_pep_clone[j + 1] = leave_data;

                                /***/
                                var temp_pep = grade_pep_clone[grade_sort_arr[j + 1]].slice(0, absence_pep);
                                //将被前边借走的数据从栈里边删除
                                grade_pep_clone[grade_sort_arr[j + 1]] = us.reject(grade_pep_clone[grade_sort_arr[j + 1]], function(temp) {
                                  return !!~temp_pep.indexOf(temp)
                                })
                                //从后边借来的**放回自己的栈里
                                us.each(temp_pep, function(temp) {
                                  grade_pep_clone[grade_sort_arr[i]].push(temp)
                                })
                                /****/
                              } else {
                                //后边没数据了，往前边拉几个过来
                                var leave_data = sort_grade_pep_clone[j - 1] - absence_pep;
                                sort_grade_pep_clone[j - 1] = leave_data;
                                /***/
                                var slice_len = grade_pep_clone[grade_sort_arr[j - 1]].length - leave_data;
                                var slice_first = grade_pep_clone[grade_sort_arr[j - 1]].length;
                                var temp_pep = grade_pep_clone[grade_sort_arr[j - 1]].slice(slice_len, slice_first);
                                //将被前边借走的数据从栈里边删除
                                grade_pep_clone[grade_sort_arr[j - 1]] = us.reject(grade_pep_clone[grade_sort_arr[j - 1]], function(temp) {
                                  return !!~temp_pep.indexOf(temp)
                                })
                                //从后边借来的**放回自己的栈里
                                us.each(temp_pep, function(temp) {
                                  grade_pep_clone[grade_sort_arr[i]].push(temp)
                                })
                                /****/
                              }
                              // return ;     
                            }
                          }
                        }
                      } else {
                        var force_pep_value = grade_rule_match ? grade_rule_match.force_pep_value : '';
                        if (force_pep_value <= sort_grade_pep_clone[i]) {
                          //多出来的数据,也全部给她----即强制分布后的值不变,因为它自己已经足够不需要从别处借
                          sort_grade_pep_clone[i] = sort_grade_pep_clone[i];
                        } else {
                          //因为是要>=，不够了当然要从后边的借,算法和前边<=是相同的不够就从后面去借
                          var absence_pep = force_pep_value - sort_grade_pep_clone[i];
                          //不够的人数，从后面抽取
                          //直接赋给一个变量得不到值，需先调用函数，再赋值。
                          //调用了两次才能得到值.
                          sort_grade_pep_clone[i] = force_pep_value;
                          //克隆一份初始数据,不能直接赋值操作(可以直接赋值操作，只不过前面我的赋值操作是在递归调用之后);
                          var j = i;
                          get_datas(absence_pep)
                          //recursion function
                          function get_datas(absence_pep) {
                            //判断后边是否还有数据，没有则不递归了

                            if (grade_ai_people[grade_sort_arr[j + 1]] < absence_pep) {
                              absence_pep = absence_pep - sort_grade_pep_clone[j + 1];
                              sort_grade_pep_clone[j + 1] = 0;
                              /****/
                              var temp_pep = grade_pep_clone[grade_sort_arr[j + 1]].slice(0, absence_pep);
                              //将被前边借走的数据从栈里边删除
                              grade_pep_clone[grade_sort_arr[j + 1]] = us.reject(grade_pep_clone[grade_sort_arr[j + 1]], function(temp) {
                                return !!~temp_pep.indexOf(temp)
                              })
                              //从后边借来的**放回自己的栈里
                              us.each(temp_pep, function(temp) {
                                grade_pep_clone[grade_sort_arr[i]].push(temp)
                              })
                              /****/
                              j++;
                              get_datas(absence_pep)
                            } else {
                              if (grade_ai_people[grade_sort_arr[j + 1]]) {
                                var leave_data = sort_grade_pep_clone[j + 1] - absence_pep
                                sort_grade_pep_clone[j + 1] = leave_data;
                                // return ; 
                                /***/
                                var temp_pep = grade_pep_clone[grade_sort_arr[j + 1]].slice(0, absence_pep);
                                //将被前边借走的数据从栈里边删除
                                grade_pep_clone[grade_sort_arr[j + 1]] = us.reject(grade_pep_clone[grade_sort_arr[j + 1]], function(temp) {
                                  return !!~temp_pep.indexOf(temp)
                                })
                                //从后边借来的**放回自己的栈里
                                us.each(temp_pep, function(temp) {
                                  grade_pep_clone[grade_sort_arr[i]].push(temp)
                                })
                                /****/
                                //后边没数据了，往前边拉几个    
                              } else {
                                var leave_data = sort_grade_pep_clone[j - 1] - absence_pep;
                                sort_grade_pep_clone[j - 1] = leave_data;
                                /***/
                                var slice_len = grade_pep_clone[grade_sort_arr[j - 1]].length - absence_pep;
                                var slice_first = grade_pep_clone[grade_sort_arr[j - 1]].length;
                                var temp_pep = grade_pep_clone[grade_sort_arr[j - 1]].slice(slice_len, slice_first);
                                //将被前边借走的数据从栈里边删除
                                grade_pep_clone[grade_sort_arr[j - 1]] = us.reject(grade_pep_clone[grade_sort_arr[j - 1]], function(temp) {
                                  return !!~temp_pep.indexOf(temp)
                                })
                                //从后边借来的**放回自己的栈里 
                                us.each(temp_pep, function(temp) {
                                  grade_pep_clone[grade_sort_arr[i]].push(temp)
                                })
                                /****/
                              }
                            }

                          }
                        }
                      }

                    }
                    // console.log(sort_grade_pep_clone); 
                    console.log(grade_pep_clone['A'].length + 'length1');
                    console.log(grade_pep_clone['B'].length + 'length1');
                    console.log(grade_pep_clone['C'].length + 'length1');
                    console.log(grade_pep_clone['D'].length + 'length1');
                    console.log(grade_pep_clone['E'].length + 'length1');
                    // console.log(grade_pep_clone['A']); 
                    async.times(grade_sort_arr.length, function(n, next) {
                      var grade_sort_arr_single = grade_sort_arr[n];
                      var assessment_id_arr = grade_pep_clone[grade_sort_arr_single];
                      if (assessment_id_arr.length > 0) {
                        async.times(assessment_id_arr.length, function(n, next) {
                          var assessment_id = assessment_id_arr[n];
                          var update_data = {
                            ai_forced_distribution_grade: grade_sort_arr_single
                          }
                          AssessmentInstance.findByIdAndUpdate(assessment_id, update_data, function(err, result) {
                            // console.log(result.ai_forced_distribution_grade);
                            next(null, result)
                          })
                        }, next)
                      } else {
                        next(null, null)
                      }

                    }, next)

                  }, function(err, result) {
                    cb(null, result)
                  })
                  break;
                case 'C':
                  //循环每一个分组，落在分组间的公司将进行强制分布
                  async.times(ou_group_key_all.length, function(n, next) {
                    var group_com = ou_group_key_all[n];
                    var ou_group_len = ou_group_all[group_com].length;
                    var rule_force = us.filter(force_data_single, function(temp) {
                      return temp.pep_low_value <= ou_group_len && temp.pep_high_value >= ou_group_len;
                    })
                    var E_pep_len = us.values(E_data_pep_len_ou_all[group_com]);
                    var E_pep_id = E_data_pep_id_ou_all[group_com];
                    var sort_grade_pep_clone = us.clone(E_pep_len);
                    var grade_pep_clone = us.clone(E_pep_id);
                    // console.log(grade_ai_people_sort);
                    //在for循环里递归,最终要的是递归之后返回的值如何继续运用到后续的循环中去
                    var grade_sort_arr_clone_len = grade_sort_arr.length;
                    for (var i = 0; i < grade_sort_arr.length; i++) {
                      var grade_rule_match = us.find(rule_force, function(rule) {
                        return rule.grade_name == grade_sort_arr[i]
                      })
                      //sort_grade_pep_clone[i + 1]  == grade_ai_people[grade_sort_arr[i]]
                      if (grade_rule_match.force_scale == '2') {
                        var force_pep_value = grade_rule_match.force_pep_value ? grade_rule_match.force_pep_value : '';
                        //对强制分布值和其实际等级人数值进行比较
                        if (force_pep_value <= sort_grade_pep_clone[i]) {
                          //多出来的数据
                          var leave_data = sort_grade_pep_clone[i] - force_pep_value;
                          sort_grade_pep_clone[i] = force_pep_value;
                          //将多出来的挤到数组后边去
                          sort_grade_pep_clone[i + 1] += leave_data;
                          /***/
                          var slice_len = grade_pep_clone[grade_sort_arr[i]].length - leave_data;
                          var slice_first = grade_pep_clone[grade_sort_arr[i]].length;
                          var temp_pep = grade_pep_clone[grade_sort_arr[i]].slice(slice_len, slice_first);
                          //将被前边借走的数据从栈里边删除
                          grade_pep_clone[grade_sort_arr[i]] = us.reject(grade_pep_clone[grade_sort_arr[j + 1]], function(temp) {
                            return !!~temp_pep.indexOf(temp)
                          })
                          //从后边借来的**放回自己的栈里
                          us.each(temp_pep, function(temp) {
                            grade_pep_clone[grade_sort_arr[i + 1]].push(temp)
                          })
                          /**/
                          //人的递归及排序--不太好操作，人员无法排序，所以在后面再重新组装
                        } else {

                          var absence_pep = force_pep_value - sort_grade_pep_clone[i];
                          //不够的人数，从后面抽取
                          //直接赋给一个变量得不到值，需先调用函数，再赋值。
                          //调用了两次才能得到值.
                          sort_grade_pep_clone[i] = force_pep_value;
                          //克隆一份初始数据,不能直接赋值操作(可以直接赋值操作，只不过前面我的赋值操作是在递归调用之后);
                          var j = i;
                          get_data(absence_pep)
                          //recursion function

                          function get_data(absence_pep) {
                            if (grade_pep_clone[grade_sort_arr[j + 1]] < absence_pep) {
                              absence_pep = absence_pep - sort_grade_pep_clone[j + 1];
                              sort_grade_pep_clone[j + 1] = 0;
                              /****/
                              var temp_pep = grade_pep_clone[grade_sort_arr[j + 1]].slice(0, absence_pep);
                              //将被前边借走的数据从栈里边删除
                              grade_pep_clone[grade_sort_arr[j + 1]] = us.reject(grade_pep_clone[grade_sort_arr[j + 1]], function(temp) {
                                return !!~temp_pep.indexOf(temp)
                              })
                              //从后边借来的**放回自己的栈里
                              us.each(temp_pep, function(temp) {
                                grade_pep_clone[grade_sort_arr[i]].push(temp)
                              })
                              /****/
                              j++;
                              get_data(absence_pep)
                            } else {
                              if (grade_pep_clone[grade_sort_arr[j + 1]]) {
                                var leave_data = sort_grade_pep_clone[j + 1] - absence_pep;

                                sort_grade_pep_clone[j + 1] = leave_data;

                                /***/
                                var temp_pep = grade_pep_clone[grade_sort_arr[j + 1]].slice(0, absence_pep);
                                //将被前边借走的数据从栈里边删除
                                grade_pep_clone[grade_sort_arr[j + 1]] = us.reject(grade_pep_clone[grade_sort_arr[j + 1]], function(temp) {
                                  return !!~temp_pep.indexOf(temp)
                                })
                                //从后边借来的**放回自己的栈里
                                us.each(temp_pep, function(temp) {
                                  grade_pep_clone[grade_sort_arr[i]].push(temp)
                                })
                                /****/
                              } else {
                                //后边没数据了，往前边拉几个过来
                                var leave_data = sort_grade_pep_clone[j - 1] - absence_pep;
                                sort_grade_pep_clone[j - 1] = leave_data;
                                /***/
                                var slice_len = grade_pep_clone[grade_sort_arr[j - 1]].length - leave_data;
                                var slice_first = grade_pep_clone[grade_sort_arr[j - 1]].length;
                                var temp_pep = grade_pep_clone[grade_sort_arr[j - 1]].slice(slice_len, slice_first);
                                //将被前边借走的数据从栈里边删除
                                grade_pep_clone[grade_sort_arr[j - 1]] = us.reject(grade_pep_clone[grade_sort_arr[j - 1]], function(temp) {
                                  return !!~temp_pep.indexOf(temp)
                                })
                                //从后边借来的**放回自己的栈里
                                us.each(temp_pep, function(temp) {
                                  grade_pep_clone[grade_sort_arr[i]].push(temp)
                                })
                                /****/
                              }
                              // return ;     
                            }
                          }
                        }
                      } else {
                        var force_pep_value = grade_rule_match.force_pep_value ? grade_rule_match.force_pep_value : '';
                        if (force_pep_value <= sort_grade_pep_clone[i]) {
                          //多出来的数据,也全部给她----即强制分布后的值不变,因为它自己已经足够不需要从别处借
                          sort_grade_pep_clone[i] = sort_grade_pep_clone[i];
                        } else {
                          //因为是要>=，不够了当然要从后边的借,算法和前边<=是相同的不够就从后面去借
                          var absence_pep = force_pep_value - sort_grade_pep_clone[i];
                          //不够的人数，从后面抽取
                          //直接赋给一个变量得不到值，需先调用函数，再赋值。
                          //调用了两次才能得到值.
                          sort_grade_pep_clone[i] = force_pep_value;
                          //克隆一份初始数据,不能直接赋值操作(可以直接赋值操作，只不过前面我的赋值操作是在递归调用之后);
                          var j = i;
                          get_datas(absence_pep)
                          //recursion function
                          function get_datas(absence_pep) {
                            //判断后边是否还有数据，没有则不递归了

                            if (grade_pep_clone[grade_sort_arr[j + 1]] < absence_pep) {
                              absence_pep = absence_pep - sort_grade_pep_clone[j + 1];
                              sort_grade_pep_clone[j + 1] = 0;
                              /****/
                              var temp_pep = grade_pep_clone[grade_sort_arr[j + 1]].slice(0, absence_pep);
                              //将被前边借走的数据从栈里边删除
                              grade_pep_clone[grade_sort_arr[j + 1]] = us.reject(grade_pep_clone[grade_sort_arr[j + 1]], function(temp) {
                                return !!~temp_pep.indexOf(temp)
                              })
                              //从后边借来的**放回自己的栈里
                              us.each(temp_pep, function(temp) {
                                grade_pep_clone[grade_sort_arr[i]].push(temp)
                              })
                              /****/
                              j++;
                              get_datas(absence_pep)
                            } else {
                              if (grade_pep_clone[grade_sort_arr[j + 1]]) {
                                var leave_data = sort_grade_pep_clone[j + 1] - absence_pep
                                sort_grade_pep_clone[j + 1] = leave_data;
                                // return ; 
                                /***/
                                var temp_pep = grade_pep_clone[grade_sort_arr[j + 1]].slice(0, absence_pep);
                                //将被前边借走的数据从栈里边删除
                                grade_pep_clone[grade_sort_arr[j + 1]] = us.reject(grade_pep_clone[grade_sort_arr[j + 1]], function(temp) {
                                  return !!~temp_pep.indexOf(temp)
                                })
                                //从后边借来的**放回自己的栈里
                                us.each(temp_pep, function(temp) {
                                  grade_pep_clone[grade_sort_arr[i]].push(temp)
                                })
                                /****/
                                //后边没数据了，往前边拉几个    
                              } else {
                                var leave_data = sort_grade_pep_clone[j - 1] - absence_pep;
                                sort_grade_pep_clone[j - 1] = leave_data;
                                /***/
                                var slice_len = grade_pep_clone[grade_sort_arr[j - 1]].length - absence_pep;
                                var slice_first = grade_pep_clone[grade_sort_arr[j - 1]].length;
                                var temp_pep = grade_pep_clone[grade_sort_arr[j - 1]].slice(slice_len, slice_first);
                                //将被前边借走的数据从栈里边删除
                                grade_pep_clone[grade_sort_arr[j - 1]] = us.reject(grade_pep_clone[grade_sort_arr[j - 1]], function(temp) {
                                  return !!~temp_pep.indexOf(temp)
                                })
                                //从后边借来的**放回自己的栈里 
                                us.each(temp_pep, function(temp) {
                                  grade_pep_clone[grade_sort_arr[i]].push(temp)
                                })
                                /****/
                              }
                            }

                          }
                        }
                      }

                    }
                    console.log(grade_pep_clone['A'].length + 'length1');
                    console.log(grade_pep_clone['B'].length + 'length1');
                    console.log(grade_pep_clone['C'].length + 'length1');
                    console.log(grade_pep_clone['D'].length + 'length1');
                    console.log(grade_pep_clone['E'].length + 'length1');
                    // console.log(grade_pep_clone['A']);
                    async.times(grade_sort_arr.length, function(n, next) {
                      var grade_sort_arr_single = grade_sort_arr[n];
                      var assessment_id_arr = grade_pep_clone[grade_sort_arr_single];
                      if (assessment_id_arr.length > 0) {
                        async.times(assessment_id_arr.length, function(n, next) {
                          var assessment_id = assessment_id_arr[n];
                          var update_data = {
                            ai_forced_distribution_grade: grade_sort_arr_single
                          }
                          AssessmentInstance.findByIdAndUpdate(assessment_id, update_data, function(err, result) {
                            // console.log(result.ai_forced_distribution_grade);
                            next(null, result)
                          })
                        }, next)
                      } else {
                        next(null, null)
                      }

                    }, next)

                  }, function(err, result) {
                    cb(null, result)
                  })
                  break;
                case 'D':
                  //循环每一个分组，落在分组间的公司将进行强制分布
                  var group_data_clone = us.clone(group_data);
                  async.times(group_data_clone.length, function(n, next) {
                    var group_ou = group_data_clone[n].organizations;
                    var force_ou = us.filter(assess_group_ou_key_all, function(temp) {
                      return !!~group_ou.indexOf(temp)
                    })

                    var pep = 0;
                    us.each(force_ou, function(temp) {
                      pep += assess_group_ou_all[temp];
                    })
                    // var rule_data_single = us.find(rule_data, function(temp) {
                    //   return us.isEqual(temp.id, String(force_rule))
                    // })
                    // var force_data_single = rule_data_single ? rule_data_single.force_data : '';
                    var rule_force = us.filter(force_data_single, function(temp) {
                      return temp.pep_low_value <= pep && temp.pep_high_value >= pep;
                    })
                    var in_position_manager_filter = us.filter(force_assess_data, function(temp) {
                      return !!~group_ou.indexOf(temp.ou)
                    })
                    //取排序后的数据
                    var in_position_manager_sort = us.sortBy(in_position_manager_filter, function(pre, next) {
                      return next - pre
                    })
                    var grade_ai_score = {}, grade_ai_people = {}, grade_ai_people_sort = {};
                    us.each(grade_data_sort, function(grade) {
                      //自定义公司组
                      var group_data = us.filter(in_position_manager_sort, function(temp) {
                        return temp.ai_score >= grade.grade_low_value && temp.ai_score <= grade.grade_high_value
                      })
                      grade_ai_score[grade.grade_name] = group_data;
                      grade_ai_people[grade.grade_name] = group_data.length;
                      //将等级对应的人,按得分排序后放到数组里,后面第二次递归的时候需用到
                      var group_data_sort = us.sortBy(group_data, function(prev, next) {
                        return next - prev
                      })
                      var pep_arr = [],
                        pep_score = [];
                      us.each(group_data_sort, function(temp) {

                        //把人换成ID,ID唯一，people不一定唯一
                        // pep_arr.push(temp.people)
                        pep_arr.push(temp.id)
                        pep_score.push(temp.ai_score)
                      })
                      grade_ai_people_sort[grade.grade_name] = pep_arr;

                      // console.log(grade.grade_name);  
                      // return grade_name
                    })
                    //取排序后的等级对应人数值，并clone一份备用 ---公司的
                    var sort_grade_pep = us.values(grade_ai_people);
                    var sort_grade_pep_clone = us.clone(sort_grade_pep);
                    var grade_pep_clone = us.clone(grade_ai_people_sort);
                    // console.log(grade_ai_people_sort);
                    //在for循环里递归,最终要的是递归之后返回的值如何继续运用到后续的循环中去
                    var grade_sort_arr_clone_len = grade_sort_arr.length;
                    console.log(sort_grade_pep_clone);
                    for (var i = 0; i < grade_sort_arr.length; i++) {
                      var grade_rule_match = us.find(rule_force, function(rule) {
                        return rule.grade_name == grade_sort_arr[i]
                      })
                      //sort_grade_pep_clone[i + 1]  == grade_ai_people[grade_sort_arr[i]]
                      if (grade_rule_match.force_scale == '2') {
                        var force_pep_value = grade_rule_match.force_pep_value ? grade_rule_match.force_pep_value : '';
                        //对强制分布值和其实际等级人数值进行比较
                        if (force_pep_value <= sort_grade_pep_clone[i]) {
                          //多出来的数据
                          var leave_data = sort_grade_pep_clone[i] - force_pep_value;
                          sort_grade_pep_clone[i] = force_pep_value;
                          //将多出来的挤到数组后边去
                          sort_grade_pep_clone[i + 1] += leave_data;
                          /***/
                          var slice_len = grade_pep_clone[grade_sort_arr[i]].length - leave_data;
                          var slice_first = grade_pep_clone[grade_sort_arr[i]].length;
                          var temp_pep = grade_pep_clone[grade_sort_arr[i]].slice(slice_len, slice_first);
                          //将被前边借走的数据从栈里边删除
                          grade_pep_clone[grade_sort_arr[i]] = us.reject(grade_pep_clone[grade_sort_arr[j + 1]], function(temp) {
                            return !!~temp_pep.indexOf(temp)
                          })
                          //从后边借来的**放回自己的栈里
                          us.each(temp_pep, function(temp) {
                            grade_pep_clone[grade_sort_arr[i + 1]].push(temp)
                          })
                          /**/
                          //人的递归及排序--不太好操作，人员无法排序，所以在后面再重新组装
                        } else {
                          var absence_pep = force_pep_value - sort_grade_pep_clone[i];
                          //不够的人数，从后面抽取
                          //直接赋给一个变量得不到值，需先调用函数，再赋值。
                          //调用了两次才能得到值.
                          sort_grade_pep_clone[i] = force_pep_value;
                          //克隆一份初始数据,不能直接赋值操作(可以直接赋值操作，只不过前面我的赋值操作是在递归调用之后);
                          var j = i;
                          get_data(absence_pep)
                          //recursion function

                          function get_data(absence_pep) {
                            if (grade_ai_people[grade_sort_arr[j + 1]] < absence_pep) {
                              absence_pep = absence_pep - sort_grade_pep_clone[j + 1];
                              sort_grade_pep_clone[j + 1] = 0;
                              /****/
                              var temp_pep = grade_pep_clone[grade_sort_arr[j + 1]].slice(0, absence_pep);
                              //将被前边借走的数据从栈里边删除
                              grade_pep_clone[grade_sort_arr[j + 1]] = us.reject(grade_pep_clone[grade_sort_arr[j + 1]], function(temp) {
                                return !!~temp_pep.indexOf(temp)
                              })
                              //从后边借来的**放回自己的栈里
                              us.each(temp_pep, function(temp) {
                                grade_pep_clone[grade_sort_arr[i]].push(temp)
                              })
                              /****/
                              j++;
                              get_data(absence_pep)
                            } else {
                              if (grade_ai_people[grade_sort_arr[j + 1]]) {
                                var leave_data = sort_grade_pep_clone[j + 1] - absence_pep;

                                sort_grade_pep_clone[j + 1] = leave_data;

                                /***/
                                var temp_pep = grade_pep_clone[grade_sort_arr[j + 1]].slice(0, absence_pep);
                                //将被前边借走的数据从栈里边删除
                                grade_pep_clone[grade_sort_arr[j + 1]] = us.reject(grade_pep_clone[grade_sort_arr[j + 1]], function(temp) {
                                  return !!~temp_pep.indexOf(temp)
                                })
                                //从后边借来的**放回自己的栈里
                                us.each(temp_pep, function(temp) {
                                  grade_pep_clone[grade_sort_arr[i]].push(temp)
                                })
                                /****/
                              } else {
                                //后边没数据了，往前边拉几个过来
                                var leave_data = sort_grade_pep_clone[j - 1] - absence_pep;
                                sort_grade_pep_clone[j - 1] = leave_data;
                                /***/
                                var slice_len = grade_pep_clone[grade_sort_arr[j - 1]].length - leave_data;
                                var slice_first = grade_pep_clone[grade_sort_arr[j - 1]].length;
                                var temp_pep = grade_pep_clone[grade_sort_arr[j - 1]].slice(slice_len, slice_first);
                                //将被前边借走的数据从栈里边删除
                                grade_pep_clone[grade_sort_arr[j - 1]] = us.reject(grade_pep_clone[grade_sort_arr[j - 1]], function(temp) {
                                  return !!~temp_pep.indexOf(temp)
                                })
                                //从后边借来的**放回自己的栈里
                                us.each(temp_pep, function(temp) {
                                  grade_pep_clone[grade_sort_arr[i]].push(temp)
                                })
                                /****/
                              }
                              // return ;     
                            }
                          }
                        }
                      } else {
                        var force_pep_value = grade_rule_match.force_pep_value ? grade_rule_match.force_pep_value : '';
                        if (force_pep_value <= sort_grade_pep_clone[i]) {
                          //多出来的数据,也全部给她----即强制分布后的值不变,因为它自己已经足够不需要从别处借
                          sort_grade_pep_clone[i] = sort_grade_pep_clone[i];
                        } else {
                          //因为是要>=，不够了当然要从后边的借,算法和前边<=是相同的不够就从后面去借
                          var absence_pep = force_pep_value - sort_grade_pep_clone[i];
                          //不够的人数，从后面抽取
                          //直接赋给一个变量得不到值，需先调用函数，再赋值。
                          //调用了两次才能得到值.
                          sort_grade_pep_clone[i] = force_pep_value;
                          //克隆一份初始数据,不能直接赋值操作(可以直接赋值操作，只不过前面我的赋值操作是在递归调用之后);
                          var j = i;
                          get_datas(absence_pep)
                          //recursion function
                          function get_datas(absence_pep) {
                            //判断后边是否还有数据，没有则不递归了

                            if (grade_ai_people[grade_sort_arr[j + 1]] < absence_pep) {
                              absence_pep = absence_pep - sort_grade_pep_clone[j + 1];
                              sort_grade_pep_clone[j + 1] = 0;
                              /****/
                              var temp_pep = grade_pep_clone[grade_sort_arr[j + 1]].slice(0, absence_pep);
                              //将被前边借走的数据从栈里边删除
                              grade_pep_clone[grade_sort_arr[j + 1]] = us.reject(grade_pep_clone[grade_sort_arr[j + 1]], function(temp) {
                                return !!~temp_pep.indexOf(temp)
                              })
                              //从后边借来的**放回自己的栈里
                              us.each(temp_pep, function(temp) {
                                grade_pep_clone[grade_sort_arr[i]].push(temp)
                              })
                              /****/
                              j++;
                              get_datas(absence_pep)
                            } else {
                              if (grade_ai_people[grade_sort_arr[j + 1]]) {
                                var leave_data = sort_grade_pep_clone[j + 1] - absence_pep
                                sort_grade_pep_clone[j + 1] = leave_data;
                                // return ; 
                                /***/
                                var temp_pep = grade_pep_clone[grade_sort_arr[j + 1]].slice(0, absence_pep);
                                //将被前边借走的数据从栈里边删除
                                grade_pep_clone[grade_sort_arr[j + 1]] = us.reject(grade_pep_clone[grade_sort_arr[j + 1]], function(temp) {
                                  return !!~temp_pep.indexOf(temp)
                                })
                                //从后边借来的**放回自己的栈里
                                us.each(temp_pep, function(temp) {
                                  grade_pep_clone[grade_sort_arr[i]].push(temp)
                                })
                                /****/
                                //后边没数据了，往前边拉几个    
                              } else {
                                var leave_data = sort_grade_pep_clone[j - 1] - absence_pep;
                                sort_grade_pep_clone[j - 1] = leave_data;
                                /***/
                                var slice_len = grade_pep_clone[grade_sort_arr[j - 1]].length - absence_pep;
                                var slice_first = grade_pep_clone[grade_sort_arr[j - 1]].length;
                                var temp_pep = grade_pep_clone[grade_sort_arr[j - 1]].slice(slice_len, slice_first);
                                //将被前边借走的数据从栈里边删除
                                grade_pep_clone[grade_sort_arr[j - 1]] = us.reject(grade_pep_clone[grade_sort_arr[j - 1]], function(temp) {
                                  return !!~temp_pep.indexOf(temp)
                                })
                                //从后边借来的**放回自己的栈里 
                                us.each(temp_pep, function(temp) {
                                  grade_pep_clone[grade_sort_arr[i]].push(temp)
                                })
                                /****/
                              }
                            }

                          }
                        }
                      }

                    }
                    // console.log(sort_grade_pep_clone); 
                    console.log(grade_pep_clone['A'].length + 'length1');
                    console.log(grade_pep_clone['B'].length + 'length1');
                    console.log(grade_pep_clone['C'].length + 'length1');
                    console.log(grade_pep_clone['D'].length + 'length1');
                    console.log(grade_pep_clone['E'].length + 'length1');
                    // console.log(grade_pep_clone['A']); 
                    async.times(grade_sort_arr.length, function(n, next) {
                      var grade_sort_arr_single = grade_sort_arr[n];
                      var assessment_id_arr = grade_pep_clone[grade_sort_arr_single];
                      if (assessment_id_arr.length > 0) {
                        async.times(assessment_id_arr.length, function(n, next) {
                          var assessment_id = assessment_id_arr[n];
                          var update_data = {
                            ai_forced_distribution_grade: grade_sort_arr_single
                          }
                          AssessmentInstance.findByIdAndUpdate(assessment_id, update_data, function(err, result) {
                            // console.log(result.ai_forced_distribution_grade);
                            next(null, result)
                          })
                        }, next)
                      } else {
                        next(null, null)
                      }

                    }, next)

                  }, function(err, result) {
                    cb(null, result)
                  })
                  break;
              }
            }
          })
        },
        display_data: function(cb) {
          cond.company = {
            $in: search_company
          }
          cond.points_system = point_data[0]; 
          AssessmentInstance.find(cond)
            .populate('people position ou company')
            .sort(sort_cond).skip(iDisplayStart).limit(iDisplayLength)
            .exec(function(err, result) {
              console.log(result.length + 'abcd');
              cb(null, result)
            })
        },
        total: function(cb) {
          console.log(cond);
          cond.company = {
            $in: search_company
          }
          cond.points_system = point_data[0];
          AssessmentInstance.count(cond, cb);
        }
      }, function(err, result) {
        cb(null, result)
      })
    }
  ], function(err, result) {
    var tblData = [];
    _.each(result.display_data, function(x) {
      var row = [];
      row.push(x.people.people_no); //col  1
      row.push(x.people.people_name); //col 2
      row.push(x.people.company_name);
      row.push(x.position_name); //col 3
      //操作
      row.push(x.ai_score);
      row.push(x.ai_grade || '');
      row.push(x.ai_forced_distribution_grade || '');
      tblData.push(row);
    });
    return res.json({
      code: 'OK',
      sEcho: sEcho,
      iTotalRecords: result.total,
      iTotalDisplayRecords: result.total,
      aaData: tblData,
    })
  })

} 

  function get_manager_position_e(position_man, ou_position_manager, force_data_single, E_data_pep_len, E_data_pep_id, grade_sort_arr, cb) {
    async.times(position_man.length, function(n, next) {
      var position_man_pep = position_man[n];
      //单个管理者对应的绩效合同数，即人数
      var position_pep_amount = ou_position_manager[position_man_pep];
      var rule_force = us.filter(force_data_single, function(temp) {
        return temp.pep_low_value <= position_pep_amount.length && temp.pep_high_value >= position_pep_amount.length;
      })
      var E_pep_len = us.values(E_data_pep_len[position_man_pep]);
      var E_pep_id = E_data_pep_id[position_man_pep];
      var sort_grade_position_pep_clone = us.clone(E_pep_len);
      var grade_ai_position_people_clone = us.clone(E_pep_id);
      // console.log(sort_grade_position_pep_clone + 'abc');
      for (var i = 0; i < grade_sort_arr.length; i++) {
        var grade_rule_match = us.find(rule_force, function(rule) {
          return rule.grade_name == grade_sort_arr[i]
        })
        var force_scale = grade_rule_match ? grade_rule_match.force_scale : '';
        //sort_grade_pep_clone[i + 1]  == grade_ai_people[grade_sort_arr[i]]
        if (force_scale == '2') {
          var force_pep_value = grade_rule_match ? grade_rule_match.force_pep_value : '';
          //对强制分布值和其实际等级人数值进行比较
          if (force_pep_value <= sort_grade_position_pep_clone[i]) {
            //多出来的数据
            var leave_data = sort_grade_position_pep_clone[i] - force_pep_value;
            sort_grade_position_pep_clone[i] = force_pep_value;
            //将多出来的挤到数组后边去
            sort_grade_position_pep_clone[i + 1] += leave_data;
            /***/
            var slice_len = grade_ai_position_people_clone[grade_sort_arr[i]].length - leave_data;
            var slice_first = grade_ai_position_people_clone[grade_sort_arr[i]].length;
            var temp_pep = grade_ai_position_people_clone[grade_sort_arr[i]].slice(slice_len, slice_first);
            //将被前边借走的数据从栈里边删除
            grade_ai_position_people_clone[grade_sort_arr[i]] = us.reject(grade_ai_position_people_clone[grade_sort_arr[j + 1]], function(temp) {
              return !!~temp_pep.indexOf(temp)
            })
            //从后边借来的**放回自己的栈里
            us.each(temp_pep, function(temp) {
              grade_ai_position_people_clone[grade_sort_arr[i + 1]].push(temp)
            })
            /**/
            //人的递归及排序--不太好操作，人员无法排序，所以在后面再重新组装
          } else {
            var absence_pep = force_pep_value - sort_grade_position_pep_clone[i];
            //不够的人数，从后面抽取
            //直接赋给一个变量得不到值，需先调用函数，再赋值。
            //调用了两次才能得到值.
            sort_grade_position_pep_clone[i] = force_pep_value;
            //克隆一份初始数据,不能直接赋值操作(可以直接赋值操作，只不过前面我的赋值操作是在递归调用之后);
            var j = i;
            get_data(absence_pep)
            //recursion function

            function get_data(absence_pep) {
              if (sort_grade_position_pep_clone[j + 1] < absence_pep) {
                absence_pep = absence_pep - sort_grade_position_pep_clone[j + 1];
                sort_grade_position_pep_clone[j + 1] = 0;
                /****/
                var temp_pep = grade_ai_position_people_clone[grade_sort_arr[j + 1]].slice(0, absence_pep);
                //将被前边借走的数据从栈里边删除
                grade_ai_position_people_clone[grade_sort_arr[j + 1]] = us.reject(grade_ai_position_people_clone[grade_sort_arr[j + 1]], function(temp) {
                  return !!~temp_pep.indexOf(temp)
                })
                //从后边借来的**放回自己的栈里
                us.each(temp_pep, function(temp) {
                  grade_ai_position_people_clone[grade_sort_arr[i]].push(temp)
                })
                /****/
                j++;
                get_data(absence_pep)
              } else {
                if (grade_ai_position_people_clone[grade_sort_arr[j + 1]]) {
                  var leave_data = sort_grade_position_pep_clone[j + 1] - absence_pep;

                  sort_grade_position_pep_clone[j + 1] = leave_data;

                  /***/
                  var temp_pep = grade_ai_position_people_clone[grade_sort_arr[j + 1]].slice(0, absence_pep);
                  //将被前边借走的数据从栈里边删除
                  grade_ai_position_people_clone[grade_sort_arr[j + 1]] = us.reject(grade_ai_position_people_clone[grade_sort_arr[j + 1]], function(temp) {
                    return !!~temp_pep.indexOf(temp)
                  })
                  //从后边借来的**放回自己的栈里
                  us.each(temp_pep, function(temp) {
                    grade_ai_position_people_clone[grade_sort_arr[i]].push(temp)
                  })
                  /****/
                } else {
                  //后边没数据了，往前边拉几个过来
                  var leave_data = sort_grade_position_pep_clone[j - 1] - absence_pep;
                  sort_grade_position_pep_clone[j - 1] = leave_data;
                  /***/
                  var slice_len = grade_ai_position_people_clone[grade_sort_arr[j - 1]].length - leave_data;
                  var slice_first = grade_ai_position_people_clone[grade_sort_arr[j - 1]].length;
                  var temp_pep = grade_ai_position_people_clone[grade_sort_arr[j - 1]].slice(slice_len, slice_first);
                  //将被前边借走的数据从栈里边删除
                  grade_ai_position_people_clone[grade_sort_arr[j - 1]] = us.reject(grade_ai_position_people_clone[grade_sort_arr[j - 1]], function(temp) {
                    return !!~temp_pep.indexOf(temp)
                  })
                  //从后边借来的**放回自己的栈里
                  us.each(temp_pep, function(temp) {
                    grade_ai_position_people_clone[grade_sort_arr[i]].push(temp)
                  })
                  /****/
                }
                // return ;     
              }
            }
          }
        } else {
          var force_pep_value = grade_rule_match.force_pep_value ? grade_rule_match.force_pep_value : '';
          if (force_pep_value <= sort_grade_position_pep_clone[i]) {
            //多出来的数据,也全部给她----即强制分布后的值不变,因为它自己已经足够不需要从别处借
            sort_grade_position_pep_clone[i] = sort_grade_position_pep_clone[i];
          } else {
            //因为是要>=，不够了当然要从后边的借,算法和前边<=是相同的不够就从后面去借
            var absence_pep = force_pep_value - sort_grade_position_pep_clone[i];
            //不够的人数，从后面抽取
            //直接赋给一个变量得不到值，需先调用函数，再赋值。
            //调用了两次才能得到值.
            sort_grade_position_pep_clone[i] = force_pep_value;
            //克隆一份初始数据,不能直接赋值操作(可以直接赋值操作，只不过前面我的赋值操作是在递归调用之后);
            var j = i;
            get_datas(absence_pep)
            //recursion function
            function get_datas(absence_pep) {
              //判断后边是否还有数据，没有则不递归了

              if (sort_grade_position_pep_clone[grade_sort_arr[j + 1]] < absence_pep) {
                absence_pep = absence_pep - sort_grade_position_pep_clone[j + 1];
                sort_grade_position_pep_clone[j + 1] = 0;
                /****/
                var temp_pep = grade_ai_position_people_clone[grade_sort_arr[j + 1]].slice(0, absence_pep);
                //将被前边借走的数据从栈里边删除
                grade_ai_position_people_clone[grade_sort_arr[j + 1]] = us.reject(grade_ai_position_people_clone[grade_sort_arr[j + 1]], function(temp) {
                  return !!~temp_pep.indexOf(temp)
                })
                //从后边借来的**放回自己的栈里
                us.each(temp_pep, function(temp) {
                  grade_ai_position_people_clone[grade_sort_arr[i]].push(temp)
                })
                /****/
                j++;
                get_datas(absence_pep)
              } else {
                if (sort_grade_position_pep_clone[grade_sort_arr[j + 1]]) {
                  var leave_data = sort_grade_position_pep_clone[j + 1] - absence_pep
                  sort_grade_position_pep_clone[j + 1] = leave_data;
                  // return ; 
                  /***/
                  var temp_pep = grade_ai_position_people_clone[grade_sort_arr[j + 1]].slice(0, absence_pep);
                  //将被前边借走的数据从栈里边删除
                  grade_ai_position_people_clone[grade_sort_arr[j + 1]] = us.reject(grade_ai_position_people_clone[grade_sort_arr[j + 1]], function(temp) {
                    return !!~temp_pep.indexOf(temp)
                  })
                  //从后边借来的**放回自己的栈里
                  us.each(temp_pep, function(temp) {
                    grade_ai_position_people_clone[grade_sort_arr[i]].push(temp)
                  })
                  /****/
                  //后边没数据了，往前边拉几个    
                } else {
                  var leave_data = sort_grade_position_pep_clone[j - 1] - absence_pep;
                  sort_grade_position_pep_clone[j - 1] = leave_data;
                  /***/
                  var slice_len = grade_ai_position_people_clone[grade_sort_arr[j - 1]].length - absence_pep;
                  var slice_first = grade_ai_position_people_clone[grade_sort_arr[j - 1]].length;
                  var temp_pep = grade_ai_position_people_clone[grade_sort_arr[j - 1]].slice(slice_len, slice_first);
                  //将被前边借走的数据从栈里边删除
                  grade_ai_position_people_clone[grade_sort_arr[j - 1]] = us.reject(grade_ai_position_people_clone[grade_sort_arr[j - 1]], function(temp) {
                    return !!~temp_pep.indexOf(temp)
                  })
                  //从后边借来的**放回自己的栈里 
                  us.each(temp_pep, function(temp) {
                    grade_ai_position_people_clone[grade_sort_arr[i]].push(temp)
                  })
                  /****/
                }
              }

            }
          }
        }

      }
      console.log(grade_ai_position_people_clone['A'].length);
      console.log(grade_ai_position_people_clone['B'].length);
      console.log(grade_ai_position_people_clone['C'].length);
      console.log(grade_ai_position_people_clone['D'].length);
      console.log(grade_ai_position_people_clone['E'].length);
      // console.log(grade_ai_position_people_clone['A']);
      async.times(grade_sort_arr.length, function(n, next) {
        var grade_sort_arr_single = grade_sort_arr[n];
        var assessment_id_arr = grade_ai_position_people_clone[grade_sort_arr_single];
        if (assessment_id_arr.length > 0) {
          async.times(assessment_id_arr.length, function(n, next) {
            var assessment_id = assessment_id_arr[n];
            var update_data = {
              ai_forced_distribution_grade: grade_sort_arr_single
            }
            AssessmentInstance.findByIdAndUpdate(assessment_id, update_data, function(err, result) {
              next(null, result)
            })
          }, next)
        } else {
          next(null, null)
        }

      }, next)
    }, function(err, result) {
      cb(result)
    })
  }

  function get_manager_position_f(group_data_clone, grade_data_sort, grade_sort_arr, assess_group_pos_key, assess_group_pos, force_data_single, position_manager, cb) {
    async.times(group_data_clone.length, function(n, next) {
      var group_pos = group_data_clone[n].manager_positions;
      var force_pos = us.filter(assess_group_pos_key, function(temp) {
        return !!~group_pos.indexOf(temp)
      })

      var pep = 0;
      us.each(force_pos, function(temp) {
        pep += assess_group_pos[temp];
      })
      var rule_force = us.filter(force_data_single, function(temp) {
        return temp.pep_low_value <= pep && temp.pep_high_value >= pep;
      })
      var position_filter = us.filter(position_manager, function(temp) {
        return !!~group_pos.indexOf(temp.position.id)
      })
      var position_filter_sort = us.sortBy(position_filter, function(prev, next) {
        return next - prev
      })
      var E_pep_len_temp = {}, E_pep_id_temp = {};
      us.each(grade_data_sort, function(grade) {
        //自定义公司组
        var group_data = us.filter(position_filter_sort, function(temp) {
          return temp.ai_score >= grade.grade_low_value && temp.ai_score <= grade.grade_high_value
        })
        E_pep_len_temp[grade.grade_name] = group_data.length;
        //将等级对应的人,按得分排序后放到数组里,后面第二次递归的时候需用到
        var group_data_sort = us.sortBy(group_data, function(prev, next) {
          return next - prev
        })
        var pep_arr = [];
        us.each(group_data_sort, function(temp) {

          //把人换成ID,ID唯一，people不一定唯一
          // pep_arr.push(temp.people)
          pep_arr.push(temp.id)
        })
        E_pep_id_temp[grade.grade_name] = pep_arr;
      })
      var E_pep_len = us.values(E_pep_len_temp);
      var sort_grade_position_pep_clone = us.clone(E_pep_len);
      var grade_ai_position_people_clone = us.clone(E_pep_id_temp);
      // console.log(sort_grade_position_pep_clone + 'abc');
      for (var i = 0; i < grade_sort_arr.length; i++) {
        var grade_rule_match = us.find(rule_force, function(rule) {
          return rule.grade_name == grade_sort_arr[i]
        })
        //sort_grade_pep_clone[i + 1]  == grade_ai_people[grade_sort_arr[i]]
        var force_scale = grade_rule_match ? grade_rule_match.force_scale : ''
        if (force_scale == '2') {
          var force_pep_value = grade_rule_match.force_pep_value ? grade_rule_match.force_pep_value : '';
          //对强制分布值和其实际等级人数值进行比较
          if (force_pep_value <= sort_grade_position_pep_clone[i]) {
            //多出来的数据
            var leave_data = sort_grade_position_pep_clone[i] - force_pep_value;
            sort_grade_position_pep_clone[i] = force_pep_value;
            //将多出来的挤到数组后边去
            sort_grade_position_pep_clone[i + 1] += leave_data;
            /***/
            var slice_len = grade_ai_position_people_clone[grade_sort_arr[i]].length - leave_data;
            var slice_first = grade_ai_position_people_clone[grade_sort_arr[i]].length;
            var temp_pep = grade_ai_position_people_clone[grade_sort_arr[i]].slice(slice_len, slice_first);
            //将被前边借走的数据从栈里边删除
            grade_ai_position_people_clone[grade_sort_arr[i]] = us.reject(grade_ai_position_people_clone[grade_sort_arr[j + 1]], function(temp) {
              return !!~temp_pep.indexOf(temp)
            })
            //从后边借来的**放回自己的栈里
            us.each(temp_pep, function(temp) {
              grade_ai_position_people_clone[grade_sort_arr[i + 1]].push(temp)
            })
            /**/
            //人的递归及排序--不太好操作，人员无法排序，所以在后面再重新组装
          } else {
            var absence_pep = force_pep_value - sort_grade_position_pep_clone[i];
            //不够的人数，从后面抽取
            //直接赋给一个变量得不到值，需先调用函数，再赋值。
            //调用了两次才能得到值.
            sort_grade_position_pep_clone[i] = force_pep_value;
            //克隆一份初始数据,不能直接赋值操作(可以直接赋值操作，只不过前面我的赋值操作是在递归调用之后);
            var j = i;
            get_data(absence_pep)
            //recursion function

            function get_data(absence_pep) {
              if (sort_grade_position_pep_clone[j + 1] < absence_pep) {
                absence_pep = absence_pep - sort_grade_position_pep_clone[j + 1];
                sort_grade_position_pep_clone[j + 1] = 0;
                /****/
                var temp_pep = grade_ai_position_people_clone[grade_sort_arr[j + 1]].slice(0, absence_pep);
                //将被前边借走的数据从栈里边删除
                grade_ai_position_people_clone[grade_sort_arr[j + 1]] = us.reject(grade_ai_position_people_clone[grade_sort_arr[j + 1]], function(temp) {
                  return !!~temp_pep.indexOf(temp)
                })
                //从后边借来的**放回自己的栈里
                us.each(temp_pep, function(temp) {
                  grade_ai_position_people_clone[grade_sort_arr[i]].push(temp)
                })
                /****/
                j++;
                get_data(absence_pep)
              } else {
                if (grade_ai_position_people_clone[grade_sort_arr[j + 1]]) {
                  var leave_data = sort_grade_position_pep_clone[j + 1] - absence_pep;

                  sort_grade_position_pep_clone[j + 1] = leave_data;

                  /***/
                  var temp_pep = grade_ai_position_people_clone[grade_sort_arr[j + 1]].slice(0, absence_pep);
                  //将被前边借走的数据从栈里边删除
                  grade_ai_position_people_clone[grade_sort_arr[j + 1]] = us.reject(grade_ai_position_people_clone[grade_sort_arr[j + 1]], function(temp) {
                    return !!~temp_pep.indexOf(temp)
                  })
                  //从后边借来的**放回自己的栈里
                  us.each(temp_pep, function(temp) {
                    grade_ai_position_people_clone[grade_sort_arr[i]].push(temp)
                  })
                  /****/
                } else {
                  //后边没数据了，往前边拉几个过来
                  var leave_data = sort_grade_position_pep_clone[j - 1] - absence_pep;
                  sort_grade_position_pep_clone[j - 1] = leave_data;
                  /***/
                  var slice_len = grade_ai_position_people_clone[grade_sort_arr[j - 1]].length - leave_data;
                  var slice_first = grade_ai_position_people_clone[grade_sort_arr[j - 1]].length;
                  var temp_pep = grade_ai_position_people_clone[grade_sort_arr[j - 1]].slice(slice_len, slice_first);
                  //将被前边借走的数据从栈里边删除
                  grade_ai_position_people_clone[grade_sort_arr[j - 1]] = us.reject(grade_ai_position_people_clone[grade_sort_arr[j - 1]], function(temp) {
                    return !!~temp_pep.indexOf(temp)
                  })
                  //从后边借来的**放回自己的栈里
                  us.each(temp_pep, function(temp) {
                    grade_ai_position_people_clone[grade_sort_arr[i]].push(temp)
                  })
                  /****/
                }
                // return ;     
              }
            }
          }
        } else {
          var force_pep_value = grade_rule_match ? grade_rule_match.force_pep_value : '';
          if (force_pep_value <= sort_grade_position_pep_clone[i]) {
            //多出来的数据,也全部给她----即强制分布后的值不变,因为它自己已经足够不需要从别处借
            sort_grade_position_pep_clone[i] = sort_grade_position_pep_clone[i];
          } else {
            //因为是要>=，不够了当然要从后边的借,算法和前边<=是相同的不够就从后面去借
            var absence_pep = force_pep_value - sort_grade_position_pep_clone[i];
            //不够的人数，从后面抽取
            //直接赋给一个变量得不到值，需先调用函数，再赋值。
            //调用了两次才能得到值.
            sort_grade_position_pep_clone[i] = force_pep_value;
            //克隆一份初始数据,不能直接赋值操作(可以直接赋值操作，只不过前面我的赋值操作是在递归调用之后);
            var j = i;
            get_datas(absence_pep)
            //recursion function
            function get_datas(absence_pep) {
              //判断后边是否还有数据，没有则不递归了

              if (sort_grade_position_pep_clone[grade_sort_arr[j + 1]] < absence_pep) {
                absence_pep = absence_pep - sort_grade_position_pep_clone[j + 1];
                sort_grade_position_pep_clone[j + 1] = 0;
                /****/
                var temp_pep = grade_ai_position_people_clone[grade_sort_arr[j + 1]].slice(0, absence_pep);
                //将被前边借走的数据从栈里边删除
                grade_ai_position_people_clone[grade_sort_arr[j + 1]] = us.reject(grade_ai_position_people_clone[grade_sort_arr[j + 1]], function(temp) {
                  return !!~temp_pep.indexOf(temp)
                })
                //从后边借来的**放回自己的栈里
                us.each(temp_pep, function(temp) {
                  grade_ai_position_people_clone[grade_sort_arr[i]].push(temp)
                })
                /****/
                j++;
                get_datas(absence_pep)
              } else {
                if (sort_grade_position_pep_clone[grade_sort_arr[j + 1]]) {
                  var leave_data = sort_grade_position_pep_clone[j + 1] - absence_pep
                  sort_grade_position_pep_clone[j + 1] = leave_data;
                  // return ; 
                  /***/
                  var temp_pep = grade_ai_position_people_clone[grade_sort_arr[j + 1]].slice(0, absence_pep);
                  //将被前边借走的数据从栈里边删除
                  grade_ai_position_people_clone[grade_sort_arr[j + 1]] = us.reject(grade_ai_position_people_clone[grade_sort_arr[j + 1]], function(temp) {
                    return !!~temp_pep.indexOf(temp)
                  })
                  //从后边借来的**放回自己的栈里
                  us.each(temp_pep, function(temp) {
                    grade_ai_position_people_clone[grade_sort_arr[i]].push(temp)
                  })
                  /****/
                  //后边没数据了，往前边拉几个    
                } else {
                  var leave_data = sort_grade_position_pep_clone[j - 1] - absence_pep;
                  sort_grade_position_pep_clone[j - 1] = leave_data;
                  /***/
                  var slice_len = grade_ai_position_people_clone[grade_sort_arr[j - 1]].length - absence_pep;
                  var slice_first = grade_ai_position_people_clone[grade_sort_arr[j - 1]].length;
                  var temp_pep = grade_ai_position_people_clone[grade_sort_arr[j - 1]].slice(slice_len, slice_first);
                  //将被前边借走的数据从栈里边删除
                  grade_ai_position_people_clone[grade_sort_arr[j - 1]] = us.reject(grade_ai_position_people_clone[grade_sort_arr[j - 1]], function(temp) {
                    return !!~temp_pep.indexOf(temp)
                  })
                  //从后边借来的**放回自己的栈里 
                  us.each(temp_pep, function(temp) {
                    grade_ai_position_people_clone[grade_sort_arr[i]].push(temp)
                  })
                  /****/
                }
              }

            }
          }
        }

      }
      console.log(grade_ai_position_people_clone['A'].length);
      console.log(grade_ai_position_people_clone['B'].length);
      console.log(grade_ai_position_people_clone['C'].length);
      console.log(grade_ai_position_people_clone['D'].length);
      console.log(grade_ai_position_people_clone['E'].length);
      // console.log(grade_ai_position_people_clone['A']);
      async.times(grade_sort_arr.length, function(n, next) {
        var grade_sort_arr_single = grade_sort_arr[n];
        var assessment_id_arr = grade_ai_position_people_clone[grade_sort_arr_single];
        if (assessment_id_arr.length > 0) {
          async.times(assessment_id_arr.length, function(n, next) {
            var assessment_id = assessment_id_arr[n];
            var update_data = {
              ai_forced_distribution_grade: grade_sort_arr_single
            }
            AssessmentInstance.findByIdAndUpdate(assessment_id, update_data, function(err, result) {
              // console.log(result.ai_forced_distribution_grade);
              next(null, result)
            })
          }, next)
        } else {
          next(null, null)
        }

      }, next)
    }, function(err, result) {
      cb(result)
    })
  }
var run_force_distribution_form = function(req, res) {
  var client = req.user.client.id;
  var render_data = {
    title: '强制分布计算',
    user: req.user,
    _: us
  };
  async.waterfall([

    function(cb) {
      Company.find({
        _id: {
          $in: req.user.companies
        }
      }, function(err, companies) {
        var obj = {};
        us.each(companies, function(temp) {
          obj[temp.id] = temp.company_name;
        })
        cb(null, obj)
      })
    },
    function(com_object, cb) {
      PointsSystemClient.findOne({
        client: client,
        is_base: true
      }).exec(function(err, result) {
        var company_force = result.company_force ? result.company_force : '';
        var company_if_force = us.filter(company_force, function(temp) {
          return temp.if_force == true
        })
        var com_obj = {};
        us.each(company_if_force, function(com) {
          com_obj[com.company] = com_object[com.company]
        })
        cb(null, com_obj)
      })
    }
  ], function(err, result) {
    if (err) {
      req.app.locals.handle500(err, req, res);
    };
    render_data.companies = result;
    render_data.moment = moment;
    res.render('admin/pm/force_distribution_group/force_run', render_data);
  })



} 

module.exports = function(app, checkAuth) {
  var __base_path = '/admin/pm/force_distribution_group';
  app.post(__base_path + '/force', checkAuth, run_force_distribution);
  app.get(__base_path + '/force_run', checkAuth, run_force_distribution_form)
}	

