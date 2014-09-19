var sprintf = require('sprintf').sprintf;
var async = require('async');
var moment = require('moment');
var util = require('util');
var uss = require('underscore.string');
var Client = require('../../models/client').Client;
var NumberRange = require('../../models/ddic').NumberRange;
var Position = require('../../models/position').Position;
var CompetencyDimension = require('../../models/competency').CompetencyDimension;
var People = require('../../models/people').People;
var PeopleControl = require('../../models/people').PeopleControl;
var fs = require('fs');
var User = require('../../models/user');
var easyimg = require('easyimage');
var mongoose = require('mongoose');
var Grid = require('gridfs-stream');
var CommonIndex = require('../../models/pm').CommonIndex;
//Grid.mongo = mongoose.mongo;
var _ = us = require('underscore');
var gfs = Grid(mongoose.connection.db, mongoose.mongo);
var GridFile = require('../../models/gridfs').GridFile;
var OrganizationUnit = require('../../models/organization').OrganizationUnit;
var SocialInsuranceAccount = require('../../models/payroll').SocialInsuranceAccount;
var SocialInsuranceAccountType = require('../../models/payroll').SocialInsuranceAccountType;
var SocialInsuranceAccountAreaClient = require('../../models/payroll').SocialInsuranceAccountAreaClient;
var PeopleLifeCycleConfig = require('../../models/people').PeopleLifeCycleConfig;
var PeopleLifeCycle = require('../../models/people').PeopleLifeCycle;
var PYAdjustSingle = require('../../models/payroll').PYAdjustSingle;
var PYAdjustBulk = require('../../models/payroll').PYAdjustBulk;
var AssessmentInstance = require('../../models/pm').AssessmentInstance;
var Questionnair360AndCAInstance = require('../../models/pm').Questionnair360AndCAInstance;
var CompanyPayrollVerify = require('../../models/payroll').CompanyPayrollVerify;
var TalentLambda = require('../../models/pm').TalentLambda;
var EmpLifeCycle = require('../../models/people').EmpLifeCycle;
var PayrollItemClient = require('../../models/payroll').PayrollItemClient;
var excel_maker = require('excel-export');
var pinyin = require('pinyin');
// people list
var PAEvent = require('../../models/pa').PAEvent;
var people_list = function(req, res) {
    var i18n = req.i18n;
    var client = req.user.client.id;

    var render_data = {
        title: '人员－列表查看',
        user: req.user,
    };
    // People.find({
    //     client: client,
    // }).populate('user').exec(function(err, peoples) {
    //     if (err) {
    //         req.app.locals.handle500(err, req, res);
    //     };
    //     render_data.peoples = peoples;
    res.render('admin/masterdata/people/people/list', render_data);
    // })
}

var people_list_json = function(req, res) {
    var i18n = req.i18n;
    var client = req.user.client.id;
    // console.log(req.body);
    var sEcho = req.body.sEcho ? req.body.sEcho : 1;
    //从第几行开始查
    var iDisplayStart = req.body.iDisplayStart ? req.body.iDisplayStart : 0;
    //每页显示的长度
    var iDisplayLength = req.body.iDisplayLength ? req.body.iDisplayLength : 10;
    var sSearch = req.body.sSearch || ''; //搜索框输入的值
    //查询条件
    var cond = {
        client: client,
        // terminated: false
    };
    if (req.body.companies) {
        var companies = JSON.parse(req.body.companies);
        cond.company = {
            $in: companies
        }
    }
    if (req.body.ous) {
        var ous = JSON.parse(req.body.ous);
        cond.ou = {
            $in: ous
        }
    };
    if (req.body.joblevels) {
        var joblevels = JSON.parse(req.body.joblevels);
        cond.joblevel = {
            $in: joblevels
        }
    };
    if (req.body.jobranks) {
        var jobranks = JSON.parse(req.body.jobranks);
        cond.jobrank = {
            $in: jobranks
        }
    };
    if (req.body.jobsequences) {
        var jobsequences = JSON.parse(req.body.jobsequences);
        cond.jobsequence = {
            $in: jobsequences
        }
    };
    if (req.body.jobnatures) {
        var jobnatures = JSON.parse(req.body.jobnatures);
        var items = [];
        _.each(jobnatures, function(j) {
            var obj = {};
            if (j == '1') {
                obj.position_manager = true;
            } else if (j == '2') {
                obj.position_is_knowledge = true;
            } else if (j == '3') {
                obj.position_is_key = true;
            } else if (j == '4') {
                obj.position_manager = false;
                obj.position_is_knowledge = false;
                obj.position_is_key = false;
            };
            items.push(obj)
        })
        cond.$or = items;
    };
    if (req.body.emp_status) {
        var emp_status = JSON.parse(req.body.emp_status);
        var is_normals = [];
        var items = [];
        _.each(emp_status, function(j) {
            var obj = {}
            if (j == '1') {
                obj.block = false;
                is_normals.push(obj)
            } else if (j == '2') {
                obj.block = true;
                is_normals.push(obj)
            } else if (j == '3') {
                items.push('P');
            } else if (j == '4') {
                items.push('H');
            } else if (j == '5') {
                items.push('L');
            } else if (j == '6') {
                items.push('R');
            }

        })
        if (is_normals.length > 0) {
            cond.$or = is_normals;
        };
        if (items.length > 0) {
            cond.employee_status = {
                $in: items
            }
        };
    }
    if (req.body.genders) {
        var genders = JSON.parse(req.body.genders);
        cond.gender = {
            $in: genders
        }
    };
    if (req.body.has_pt_positions) {
        var has_pt_positions = JSON.parse(req.body.has_pt_positions);
        var items = [];
        _.each(has_pt_positions, function(j) {
            var obj = {};
            if (j == '1') {
                obj.has_parttime_positions = true;
            } else if (j == '2') {
                obj.has_parttime_positions = false;
            }
            items.push(obj)
        })
        cond.$or = items;
    };
    // if (req.body.block) {
    //     cond.block = {
    //         $in: JSON.parse(req.body.block)
    //     };
    // };
    // if (req.body.employee_status) {
    //     cond.employee_status = {
    //         $in: JSON.parse(req.body.employee_status)
    //     };
    // };
    if (req.body.gender) {
        cond.gender = {
            $in: JSON.parse(req.body.gender)
        };
    };

    //正则表达式－查询通用搜索框
    var re = /./;
    if (sSearch != "") {
        re.compile(sSearch);
        var objs = [{
            people_no: re
        }, {
            people_name: re
        }, {
            position_name: re
        }, {
            ou_name: re
        }, {
            cpmpany_name: re
        }];
        cond.$or = objs;
    }
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
    var sort_cond = {};
    for (var i = 0; i < col_sort_num; i++) {
        if (req.body['iSortCol_' + i]) { //循环来判断是不是有
            var dir = req.body['sSortDir_' + i];

            sort_cond[col_name[req.body['iSortCol_' + i]]] = (dir == 'asc') ? 1 : -1;
        }
    };

    async.parallel({
        total: function(cb) {
            People.count(cond, cb);
        },
        people: function(cb) {
            People.find(cond).sort(sort_cond).skip(iDisplayStart).limit(iDisplayLength).exec(cb);
        }

    }, function(err, result) {
        if (err) {
            return res.json({
                code: 'ERR',
                msg: '内部服务器错误：' + err
            });
        } else {
            var tblData = [];
            var people_status_class = {
                'P': 'text-info',
                'H': 'text-success',
                'L': 'text-warning',
                'R': 'employee_status'
            };
            var people_status_title = {
                'P': '试用期',
                'H': '正式雇佣',
                'L': '停薪留职',
                'R': '已离职'
            };
            _.each(result.people, function(x) {
                var row = [];
                var block_icon = x.block ? '<i class="icon-fixed-width icon-lock text-error" data-title="锁定状态"></i>' : '<i class="icon-fixed-width icon-unlock text-success" data-title="正常状态"></i>';
                var status_icon = '<i class="icon-fixed-width icon-user ' + people_status_class[x.employee_status] + '" data-title="' + people_status_title[x.employee_status] + '"></i>';

                row.push(block_icon + status_icon); //col 0
                row.push(x.people_no); //col 1
                row.push(x.people_name); //col 2
                var avatar_tmp = '<img class="img-polaroid" src="%s" width="40px" height="40px" style="width:40px;height:40px;">';
                var avatar_url = (x.avatar) ? '/gridfs/get/' + x.avatar : '/img/no-avatar.jpg';
                row.push(sprintf(avatar_tmp, avatar_url)); //col 3
                row.push((x.gender == 'M') ? '<i class="icon-male icon-2x text-info" data-title="男"></i>' : '<i class="icon-female icon-2x text-error" data-title="女"></i>'); //col 4
                row.push(moment(x.birthday).format('YYYY-MM-DD')); //col 5
                row.push(x.position_name); //col 6
                row.push(x.ou_name); //col 7
                row.push(x.company_name); //col 8


                //操作
                var btns = [];
                btns.push('<div class="btn-group">');
                btns.push(sprintf('<a href="/admin/masterdata/people/edit/%s?mode=view" class="btn btn-small" ><i class="icon-eye-open"></i></a>', x._id));
                btns.push(sprintf('<a href="/admin/masterdata/people/edit/%s" class="btn btn-small" ><i class="icon-pencil"></i></a>', x._id));
                var toggle_icon = x.block ? "icon-key" : "icon-lock";
                btns.push(sprintf('<a href="#" onclick="toggle_block_people(%'%s%')" class="btn btn-small" ><i class="%s"></i></a>', x._id, toggle_icon));
                btns.push('</div>');
                row.push(btns.join(''));
                // console.log(btns.join(''));
                tblData.push(row);
            });
            return res.json({
                code: 'OK',
                sEcho: sEcho,
                iTotalRecords: result.total,
                iTotalDisplayRecords: result.total,
                aaData: tblData,
            });
        };
    })
}

var people_add_form = function(req, res) {
    var i18n = req.i18n;
    var client = req.user.client.id;

    var render_data = {
        title: '人员－新增',
        user: req.user,
    };
    res.render('admin/masterdata/people/people/add', render_data);
}

var people_add_save = function(req, res) {
    var i18n = req.i18n;
    var client = req.user.client;
    var data4create = {
        client: client.id,
        // people_no: req.body.people_no,
        idcard: req.body.idcard,
        firstname: uss.trim(req.body.firstname),
        lastname: uss.trim(req.body.lastname),
        people_name: uss.trim(req.body.firstname) + uss.trim(req.body.lastname),
        gender: req.body.gender || 'M',
        birthday: req.body.birthday,
        email: uss.trim(req.body.email),
        tel: uss.trim(req.body.tel),
        census_register: req.body.census_register || '',
        cell: uss.trim(req.body.cell),
        ethnic_code: uss.trim(req.body.ethnic_code),
        ethnic_name: uss.trim(req.body.ethnic_name),
        religion_code: uss.trim(req.body.religion_code),
        religion_name: uss.trim(req.body.religion_name),
        validFrom: req.body.validFrom || new Date(),
        validTo: req.body.validTo || new Date('9999-12-31'),
        position: req.body.position,
        first_position: req.body.position,
        position_name: req.body.position_name,
        activate: true,
        block: false,
        // user : req.body.user || null,  //自动根据工号来创建用户，初始密码000000。
    };
    async.waterfall([

        function(callback) {
            //判断系统配置中的工号是自动给号还是手工给号
            if (client.config.people_code.src == 'SYSTEM') { //系统自动给号
                NumberRange.getNextNumber(client.id, client.config.people_code.nr_obj, function(people_no) {
                    if (people_no) {
                        callback(null, people_no);
                    } else {
                        callback(new Error('获取号码失败'), null);
                    };
                })

            } else { //手工给号
                callback(null, req.body.people_no)
            };
        },

        function(people_no, callback) {
            //console.log(people_no);

            //并行创建people与user
            async.parallel({
                create_user: function(cb) {
                    var data4create_user = {
                        client: client.id,
                        username: people_no,
                        firstname: uss.trim(req.body.firstname),
                        lastname: uss.trim(req.body.lastname),
                        people_name: uss.trim(req.body.firstname) + uss.trim(req.body.lastname),
                        password: '000000'
                    };
                    //console.log(data4create_user);
                    User.create(data4create_user, cb);
                },
                create_people: function(cb) {
                    data4create.people_no = people_no;
                    //console.log(data4create);
                    People.create(data4create, cb);
                }
            }, function(err, results) {
                if (err) {
                    return callback(err, null);
                };
                async.parallel({
                    set_user: function(cb) {
                        results.create_people.user = results.create_user.id;
                        results.create_people.save(cb)
                    },
                    set_people: function(cb) {
                        results.create_user.people = results.create_people.id;
                        results.create_user.save(cb);
                    }
                }, function(err, results2) {
                    if (err) {
                        return callback(err, null);
                    };
                    return callback(null, results2);
                })

            })
        }

    ], function(err, result) {
        if (err) {
            return res.json({
                code: 'ERR',
                msg: '内部服务器错误：' + err
            });
        };
        // console.log(result);
        return res.json({
            code: 'OK',
            msg: sprintf('人员 <strong>%s:%s</strong> 创建成功！用户初始密码为000000。', result.set_user[0].people_no, result.set_user[0].full_name),
            id: result.set_user[0].id
        });
    })



}
var people_edit_sc_form = function(req, res) {
    var i18n = req.i18n;
    var client = req.user.client.id;

    var render_data = {
        title: '人员－修改(选择屏幕)',
        user: req.user,
    };
    res.render('admin/masterdata/people/people/edit_sc', render_data);
}
var people_edit_sc_manipulate = function(req, res) {
    var i18n = req.i18n;
    var client = req.user.client.id;
    var people_no = req.body.people_no;
    if (people_no) {
        People.findOne({
            client: client,
            people_no: people_no
        }).exec(function(err, people) {
            if (err) {
                return res.json({
                    code: 'ERR',
                    msg: '内部服务器错误：' + err
                });
            };
            if (people) {
                return res.json({
                    code: 'OK',
                    msg: 'Person found!',
                    people_id: people.id
                });
            } else {
                return res.json({
                    code: 'ERR',
                    msg: '输入的工号不存在。'
                });
            };
        })
    };
}
var people_edit_form = function(req, res) {
    var i18n = req.i18n;
    var client = req.user.client.id;
    moment.lang('zh-cn');
    var render_data = {
        title: '人员－修改',
        user: req.user,
    };

    var before = moment().format('YYYY')
    var after = moment().add('year', 3).format('YYYY')
    var years = us.range(parseInt(before), parseInt(after));
    render_data.years = years
    var population_fields = [
        'user',
        'it_0002',
        'it_0003',
        'it_0004',
        'it_0005',
        'it_0006',
        'it_0007',
        'it_0008',
        'it_0009',
        'it_0010',
        'parttime_positions',
        'bank_account',
        'social_insurance_account',
        'history_position.position',
        'history_position.paevent'
    ];
    var people_id = req.params.people_id;
    async.waterfall([

        function(cb) {
            People.findById(people_id)
                .populate(population_fields.join(' '))
                .exec(cb);
        },
        function(people, cb) {
            render_data.people = people;
            if (people.position) {
                async.parallel({
                    cds: function(cb) {
                        CompetencyDimension.find({}).exec(cb);
                    },
                    cc: function(cb) {
                        Position.findById(people.position).populate('competencies_client.competency').exec(cb)
                    },
                    siat_obj: function(cb) {
                        SocialInsuranceAccountType.find({}).exec(function(err, siats) {
                            if (err) {
                                req.app.locals.handle500(err, req, res);
                            };
                            if (siats) {
                                var tems = [];
                                var tems2 = [];
                                us.each(siats, function(siat) {
                                    tems.push(siat._id);
                                    tems2.push(siat.account_type)
                                })
                                var siat_obj = us.object(tems, tems2)
                                cb(null, siat_obj);
                            } else {
                                cb(null, null);
                            }

                        })
                    },
                    siatac_obj: function(cb) {
                        SocialInsuranceAccountAreaClient.find({}).exec(function(err, siatacs) {
                            if (err) {
                                req.app.locals.handle500(err, req, res);
                            };
                            if (siatacs) {
                                var tems = [];
                                var tems2 = [];
                                us.each(siatacs, function(siatac) {
                                    tems.push(siatac._id);
                                    tems2.push(siatac.city_name)
                                })
                                var siatac_obj = us.object(tems, tems2);
                                cb(null, siatac_obj);
                            } else {
                                cb(null, null);
                            }

                        })
                    }
                }, cb);
            } else {
                cb(null, null);
            };
        }
    ], function(err, result) {
        if (err) {
            req.app.locals.handle500(err, req, res);
        };
        if (result) {
            render_data.cds = result.cds;
            render_data.siat_obj = result.siat_obj;
            render_data.siatac_obj = result.siatac_obj;
            render_data.competencies_client = result.cc.competencies_client;
        } else {
            render_data.cds = null;
            render_data.siat_obj = null;
            render_data.siatac_obj = null;
            render_data.competencies_client = null;
        };
        // console.log(result);
        res.render('admin/masterdata/people/people/edit', render_data);

    })

}

var people_edit_save = function(req, res) {
    var i18n = req.i18n;
    var client = req.user.client.id;
    var people_id = req.body.people_id;
    var data4update = {
        idcard: req.body.idcard,
        firstname: uss.trim(req.body.firstname),
        lastname: uss.trim(req.body.lastname),
        people_name: uss.trim(req.body.firstname) + uss.trim(req.body.lastname),
        gender: req.body.gender || 'M',
        birthday: req.body.birthday,
        email: uss.trim(req.body.email),
        tel: uss.trim(req.body.tel),
        census_register: req.body.census_register || '',
        cell: uss.trim(req.body.cell),
        ethnic_code: uss.trim(req.body.ethnic_code),
        ethnic_name: uss.trim(req.body.ethnic_name),
        religion_code: uss.trim(req.body.religion_code),
        religion_name: uss.trim(req.body.religion_name),
        marriage_code: uss.trim(req.body.marriage_code),
        marriage_name: uss.trim(req.body.marriage_name),
        educationalbackground_code: uss.trim(req.body.educationalbackground_code),
        educationalbackground_name: uss.trim(req.body.educationalbackground_name),
        pa_code: uss.trim(req.body.pa_code),
        pa_name: uss.trim(req.body.pa_name),
        years_of_service: req.body.years_of_service,
        start_service_date: req.body.start_service_date,
        years_of_service_client: req.body.years_of_service_client,
        parttime_positions: JSON.parse(req.body.parttime_positions),
        payroll_state: !! req.body.payroll_state,
        payroll_stop_date: parseInt(req.body.payroll_stop_year + req.body.payroll_stop_month),
    };
    async.waterfall([

        function(cb) {
            People.findByIdAndUpdate(people_id, data4update).exec(cb);
        },
        function(people, cb) {
            if (people && people.user) {
                var ud = {
                    people: people.id,
                    firstname: people.firstname,
                    lastname: people.lastname,
                    people_name: people.firstname + people.lastname,
                };
                if (people.avatar) {
                    ud.avatar = people.avatar
                };
                User.findByIdAndUpdate(people.user, ud).exec(cb);
            } else {
                cb(null, null);
            };
        }
    ], function(err, result) {
        if (err) {
            return res.json({
                code: 'ERR',
                msg: '内部服务器错误：' + err
            });
        } else {
            return res.json({
                code: 'OK',
                msg: '修改成功'
            });
        };
    })

}
var people_typeahead = function(req, res) {
    var client = req.user.client.id;
    var coms = req.user.companies;
    if (!_.isArray(coms)) {
        coms = [coms];
    }
    People.find({
        client: client,
        block: false,
        company: {
            $in: coms
        }
    }, function(err, peoples) {
        if (err) {
            return res.json({
                code: 'ERR',
                msg: '内部服务器错误：' + err
            });
        };
        var ret = [];
        for (var i = 0; i < peoples.length; i++) {
            ret.push({
                id: peoples[i].id,
                code: peoples[i].people_no,
                name: peoples[i].full_name,
            });
        };
        return res.json(ret);
    })
}

var people_inputhelp = function(req, res) {
    var client = req.user.client.id;
    var employee_status = req.query.es;
    var coms = req.user.companies;
    if (!_.isArray(coms)) {
        coms = [coms];
    }
    var cond = {
        client: client,
        company: {
            $in: coms
        },
    };
    if (employee_status) {
        cond.employee_status = employee_status;
    };
    if (!employee_status || employee_status == 'P' || employee_status == 'H') {
        cond.block = false
    };

    People.find(cond, function(err, peoples) {
        if (err) {
            req.app.locals.handle500(err, req, res);
        };
        res.render('admin/masterdata/people/people/input_help', {
            peoples: peoples
        });
    })
}
var people_avatar_save = function(req, res) {
    var people_id = req.body.people_id;
    var client = req.user.client;
    // console.log(client);
    var avatar = req.files.avatar;

    People.findById(people_id, function(err, people) {
        if (err) {
            return res.json({
                code: 'ERR',
                msg: '内部服务器错误：' + err
            });
        };
        if (people) {
            var old_avatar = people.avatar;
            var user_id = people.user;
            async.series({
                resize_img: function(cb) {
                    resize_avatar(avatar, cb);
                },
                save_img: function(cb) {
                    save_to_gridfs(avatar, cb);
                },
                del_img: function(cb) {
                    delete_from_gridfs(old_avatar, cb);
                }
            }, function(err, results) {
                if (err) {
                    return res.json({
                        code: 'ERR',
                        msg: '内部服务器错误：' + err
                    });
                };
                // console.log(results);
                var avatar_file = results.save_img._id;
                async.parallel({
                    update_people: function(cb) {
                        update_people(people_id, avatar_file, cb)
                    },
                    update_user: function(cb) {
                        update_user(user_id, avatar_file, cb)
                    },
                }, function(err, results2) {
                    if (err) {
                        return res.json({
                            code: 'ERR',
                            msg: '内部服务器错误：' + err
                        });
                    };
                    return res.json({
                        code: 'OK',
                        msg: sprintf('人员 <strong>%s:%s</strong> 的头像修改成功！', results2.update_people.people_no, results2.update_people.full_name),
                    });
                })
            })
        } else {
            return res.json({
                code: 'ERR',
                msg: '人员信息不存在'
            });
        };
    })


    //缩放头像照片

    function resize_avatar(avatar, cb) {
        easyimg.resize({
            src: avatar.path,
            dst: avatar.path,
            width: client.config.avatar.width,
            height: client.config.avatar.height,
        }, cb);
    }
    //存入gridfs

    function save_to_gridfs(avatar, cb) {
        var gfs_options = {
            filename: avatar.name,
            mode: 'w',
            content_type: avatar.type,
            metadata: {
                'client': req.user.client.id,
                'user': req.user.id,
                'for': 'avatar'
            }
        };
        var writestream = gfs.createWriteStream(gfs_options);
        fs.createReadStream(avatar.path).pipe(writestream);
        writestream.on('close', function(file) {
            //console.log(file);
            //放到gridfs之后，删除临时文件。
            fs.unlink(avatar.path, function(err) {
                if (err) {
                    return cb(err, null);
                };
                cb(null, file)
            });
        });
    }
    //存入people

    function update_people(people_id, gfs_id, cb) {
        People.findByIdAndUpdate(people_id, {
            avatar: gfs_id
        }, cb);
    }
    //存入user

    function update_user(user_id, gfs_id, cb) {
        User.findByIdAndUpdate(user_id, {
            avatar: gfs_id
        }, cb);
    }
    //从gridfs删除原people对应的头像

    function delete_from_gridfs(gfs_id, cb) {
        if (gfs_id) {
            gfs.remove({
                _id: gfs_id
            }, function(err) {
                if (err) {
                    return cb(err, null);
                };
                return cb(null, '删除成功')
            });
        } else {
            cb(null, '无需删除')
        };

    }

}
var people_view_profile = function(req, res) {
    var i18n = req.i18n;
    var client = req.user.client.id;
    var people_id = req.params.people_id;
    People.findById(people_id).exec(function(err, people) {
        if (err) {
            res.send(500, err);
        };
        if (people) {
            res.render('admin/masterdata/people/people/view_profile', {
                people: people
            });
        } else {
            res.send('no people selected.');
        };
    })
}

var people_toggle_block = function(req, res) {
    var people_id = req.body.people_id;
    People.findById(people_id, function(err, people) {
        if (err) {
            return res.json({
                code: 'ERR',
                msg: '内部服务器错误：' + err
            });
        };
        if (people) {
            var op = people.block ? '解锁' : '锁定';
            people.toggle_block();
            people.activate = false; // 需要重新激活
            people.save();
            return res.json({
                code: 'OK',
                msg: sprintf('人员 <strong>%s</strong> %s成功！', people.full_name, op),
            });
        } else {
            return res.json({
                code: 'ERR',
                msg: '人员信息不存在，无法锁定/解锁。'
            });
        };
    });
}

//获取我的团队数据(获取当前用户下属的信息)
var people_get_my_team = function(req, res) {
    var client = req.user.client.id;
    var people_id = req.query.people || req.user.people || null;
    // console.log(people_id);
    if (people_id) {
        async.waterfall([

                function(cb) {
                    if (typeof(people_id) == 'string') { //people_id
                        People.findById(people_id, cb);
                    } else {
                        cb(null, people_id); //已经是对象了，后面直接用
                    };
                },
                function(people_obj, cb) {
                    async.parallel({
                        d: function(cb) { //取下级职位
                            Position.find({
                                $or: [{
                                    position_direct_superior: people_obj.position //直接领导
                                }, {
                                    position_indirect_superior: people_obj.position //间接领导
                                }]
                            }).populate('belongto_ou').exec(cb);
                        },
                        u: function(cb) { //取上级职位（position_direct_superior） 直接领导
                            // Position.findById(people_obj.position).populate('position_direct_superior').exec(cb);
                            Position.findById(people_obj.position).exec(cb);
                        },
                        // iu: function(cb) { //取上级职位（position_indirect_superior） 间接领导
                        //     Position.findById(people_obj.position).populate('position_indirect_superior').exec(cb);
                        // },
                        s: function(cb) {
                            cb(null, people_obj);
                        }
                    }, cb);

                },
                function(pos, cb) {
                    async.parallel({
                        pos: function(cb) { //相关职位
                            async.parallel({
                                d: function(cb) {
                                    cb(null, pos.d);
                                },
                                u: function(cb) {

                                    Position.findById(pos.u.position_direct_superior).populate('belongto_ou').exec(cb);
                                },
                                iu: function(cb) {
                                    Position.findById(pos.u.position_indirect_superior).populate('belongto_ou').exec(cb);
                                }
                            }, cb);
                        },
                        d: function(cb) { //取下级人员
                            if (util.isArray(pos.d) && pos.d.length > 0) {
                                People.find({
                                    $or: [{
                                        position: { //全职
                                            $in: pos.d
                                        }
                                    }, {
                                        parttime_positions: { //兼职
                                            $in: pos.d
                                        }
                                    }, ],
                                    employee_status: {
                                        $in: ['P', 'H']
                                    }

                                }).exec(cb);
                            } else {
                                cb(null, '没有下属职位');
                            };
                        },
                        u: function(cb) { //取上级人员
                            if (pos.u && pos.u.position_direct_superior) {
                                People.find({
                                    $or: [{
                                        position: pos.u.position_direct_superior //全职
                                    }, {
                                        parttime_positions: { //兼职
                                            $in: [pos.u.position_direct_superior]
                                        }
                                    }, ],
                                    employee_status: {
                                        $in: ['P', 'H']
                                    }

                                }).exec(cb);
                            } else {
                                cb(null, '没有直接上级职位');
                            };
                        },
                        iu: function(cb) { //取间接上级人员
                            if (pos.iu && pos.u.position_indirect_superior) {
                                People.find({
                                    $or: [{
                                        position: pos.u.position_indirect_superior //全职
                                    }, {
                                        parttime_positions: { //兼职
                                            $in: [pos.u.position_indirect_superior]
                                        }
                                    }, ],
                                    employee_status: {
                                        $in: ['P', 'H']
                                    }

                                }).exec(cb);
                            } else {
                                cb(null, '没有间接上级职位');
                            };
                        },
                        s: function(cb) { //自己
                            cb(null, pos.s);
                        }
                    }, cb);

                }
            ],
            function(err, results) {
                if (err) {
                    return res.json({
                        code: 'ERR',
                        msg: '内部服务器错误：' + err
                    });
                };
                //判断全职还是兼职，以便更新
                //有上级
                if (util.isArray(results.u)) {
                    _.map(results.u, function(x) {
                        var f = _.find(util.isArray(results.pos.u) ? results.pos.u : [results.pos.u], function(y) {
                            return _.isEqual(x.position, y._id);
                        });
                        if (!f) {
                            _.each(x.parttime_positions, function(z) {
                                var fp = _.find(util.isArray(results.pos.u) ? results.pos.u : [results.pos.u], function(yp) {
                                    return _.isEqual(z, yp._id);
                                })
                                if (fp) { //找到兼职的职位，更新people的position_name与ou_name用来前端展现
                                    x.position_name = fp.position_name;
                                    x.ou_name = fp.belongto_ou.ou_name;
                                };
                            });
                        };
                    });
                };
                // 有下级
                if (util.isArray(results.d)) {
                    _.map(results.d, function(x) {
                        var f = _.find(results.pos.d, function(y) {
                            return _.isEqual(x.position, y._id);
                        });
                        if (!f) {
                            _.each(x.parttime_positions, function(z) {
                                var fp = _.find(results.pos.d, function(yp) {
                                    return _.isEqual(z, yp._id);
                                })
                                if (fp) { //找到兼职的职位，更新people的position_name与ou_name用来前端展现
                                    x.position_name = fp.position_name;
                                    x.ou_name = fp.belongto_ou.ou_name;
                                };
                            });
                        };
                    });
                };
                return res.json({
                    code: 'OK',
                    msg: '数据获取成功，数据在data中。',
                    data: results
                });
            })
    } else {
        return res.json({
            code: 'ERR',
            msg: '没有人员信息'
        });
    };
}

var get_team_by_people = function(req, res) {
    var client = req.user.client.id;
    var people_id = req.params.people_id;
    // console.log(people_id);
    if (people_id) {
        async.waterfall([

            function(cb) {
                if (typeof(people_id) == 'string') { //people_id
                    People.findById(people_id, cb);
                } else {
                    cb(null, people_id); //已经是对象了，后面直接用
                };
            },
            function(people_obj, cb) {
                async.parallel({
                    d: function(cb) { //取下级职位
                        Position.find({
                            position_direct_superior: people_obj.position
                        }).populate('belongto_ou').exec(cb);
                    },
                    u: function(cb) { //取上级职位（position_direct_superior）
                        Position.findById(people_obj.position).populate('position_direct_superior').exec(cb);
                    },
                    s: function(cb) {
                        cb(null, people_obj);
                    }
                }, cb);

            },
            function(pos, cb) {
                async.parallel({
                    pos: function(cb) { //相关职位
                        async.parallel({
                            d: function(cb) {
                                cb(null, pos.d);
                            },
                            u: function(cb) {
                                Position.findById(pos.u.position_direct_superior).populate('belongto_ou').exec(cb);
                            }
                        }, cb);
                    },
                    d: function(cb) { //取下级人员
                        if (util.isArray(pos.d) && pos.d.length > 0) {
                            People.find({
                                $or: [{
                                    position: { //全职
                                        $in: pos.d
                                    }
                                }, {
                                    parttime_positions: { //兼职
                                        $in: pos.d
                                    }
                                }, ]

                            }).exec(cb);
                        } else {
                            cb(null, '没有下属职位');
                        };
                    },
                    u: function(cb) { //取上级人员
                        if (pos.u && pos.u.position_direct_superior) {
                            People.find({
                                $or: [{
                                    position: pos.u.position_direct_superior //全职
                                }, {
                                    parttime_positions: { //兼职
                                        $in: [pos.u.position_direct_superior]
                                    }
                                }, ]

                            }).exec(cb);
                        } else {
                            cb(null, '没有上级职位');
                        };
                    },
                    s: function(cb) { //自己
                        cb(null, pos.s);
                    }
                }, cb);

            }
        ], function(err, results) {
            if (err) {
                return res.json({
                    code: 'ERR',
                    msg: '内部服务器错误：' + err
                });
            };
            //判断全职还是兼职，以便更新
            //有上级
            if (util.isArray(results.u)) {
                _.map(results.u, function(x) {
                    var f = _.find(util.isArray(results.pos.u) ? results.pos.u : [results.pos.u], function(y) {
                        return _.isEqual(x.position, y._id);
                    });
                    if (!f) {
                        _.each(x.parttime_positions, function(z) {
                            var fp = _.find(util.isArray(results.pos.u) ? results.pos.u : [results.pos.u], function(yp) {
                                return _.isEqual(z, yp._id);
                            })
                            if (fp) { //找到兼职的职位，更新people的position_name与ou_name用来前端展现
                                x.position_name = fp.position_name;
                                x.ou_name = fp.belongto_ou.ou_name;
                            };
                        });
                    };
                });
            };
            // 有下级
            if (util.isArray(results.d)) {
                _.map(results.d, function(x) {
                    var f = _.find(results.pos.d, function(y) {
                        return _.isEqual(x.position, y._id);
                    });
                    if (!f) {
                        _.each(x.parttime_positions, function(z) {
                            var fp = _.find(results.pos.d, function(yp) {
                                return _.isEqual(z, yp._id);
                            })
                            if (fp) { //找到兼职的职位，更新people的position_name与ou_name用来前端展现
                                x.position_name = fp.position_name;
                                x.ou_name = fp.belongto_ou.ou_name;
                            };
                        });
                    };
                });
            };
            return res.json({
                code: 'OK',
                msg: '数据获取成功，数据在data中。',
                data: results
            });
        })
    } else {
        return res.json({
            code: 'ERR',
            msg: '没有人员信息'
        });
    };
}

//从给定的人出发，获取全部的下属，并按照职位来生成树形层级关系数据
var people_get_all_team = function(req, res) {
    var client = req.user.client.id;
    var people_id = req.query.people || req.user.people._id || null;
    var depth = req.query.depth || null; //向下挖的深度，如果null，则不做深度的限制。
    async.waterfall([

        function(cb) {
            async.parallel({
                positions: function(cb) {
                    Position.find({
                        client: client,
                        block: false,
                        activate: true
                    }).exec(cb);
                },
                peoples: function(cb) {
                    People.find({
                        client: client,
                        employee_status: {
                            $in: ['H', 'P']
                        },
                    }).select('_id firstname lastname avatar company position ou company_name position_name ou_name parttime_positions').exec(cb);
                }
            }, cb);
        },
        function(dc, cb) {
            var root_people = _.find(dc.peoples, function(x) { //把当前用户或传入的用户作为root，开始向下根据职位的层级来挖
                // console.log(x._id,people_id,_.isEqual(x._id == people_id));
                return (x._id == people_id + '');
            });
            if (root_people) {
                // return cb(null, root_people);
                // var root_position = root_people.position;
                var items = [];
                items.push({
                    id: root_people._id + '-' + root_people.position,
                    pId: null,
                    people: root_people,
                    position: root_people.position,
                    position_name: root_people.position_name,
                });
                walk(root_people, root_people.position, 0); // people, depth --直接领导的

                function walk(p_people, p_position, c_depth) {

                    c_depth += 1;
                    if (depth && c_depth > depth) {
                        return;
                    };
                    var sub_pos = _.filter(dc.positions, function(pos) { //--直接领导的 || 间接领导的
                        return _.isEqual(pos.position_direct_superior, p_position) || _.isEqual(pos.position_indirect_superior, p_position);
                    });
                    // console.log(sub_pos);
                    _.each(sub_pos, function(pos) {
                        //先获取直接任职的
                        var sub_pos_peoples = _.filter(dc.peoples, function(people) {
                            return _.isEqual(people.position, pos._id);
                        });
                        if (sub_pos_peoples.length) { //有直接任职的
                            _.each(sub_pos_peoples, function(people) {
                                items.push({
                                    id: people._id + '-' + pos._id,
                                    pId: ((p_people) ? p_people._id : 'NO_PEOPLE') + '-' + p_position,
                                    people: people,
                                    position: pos._id,
                                    position_name: pos.position_name,
                                });
                                walk(people, pos._id, c_depth);
                            });
                        } else { //没有找到直接任职的人，去兼职找找。
                            var sub_pos_peoples = _.filter(dc.peoples, function(people) {
                                var found_pos = _.find(people.parttime_positions, function(x) {
                                    return x == pos._id + '';
                                })
                                return !!found_pos;
                            })
                            if (sub_pos_peoples.length) {
                                _.each(sub_pos_peoples, function(people) {
                                    items.push({
                                        id: people._id + '-' + pos._id,
                                        pId: ((p_people) ? p_people._id : 'NO_PEOPLE') + '-' + p_position,
                                        people: people,
                                        position: pos._id,
                                        position_name: pos.position_name,
                                    });
                                    walk(people, pos._id, c_depth);
                                });
                            } else { //兼职也没找到，加一个空的人，但是节点要保留，否则整个的树就断掉了。
                                items.push({
                                    id: 'NO_PEOPLE-' + pos._id,
                                    pId: ((p_people) ? p_people._id : 'NO_PEOPLE') + '-' + p_position,
                                    people: null,
                                    position: pos._id,
                                    position_name: pos.position_name,
                                });
                                walk(null, pos._id, c_depth);
                            };
                        };


                    })
                };
                return cb(null, items);
            } else {
                return cb(null, null)
            };
        }
    ], function(err, result) {
        if (err) {
            return res.json({
                code: 'ERR',
                msg: '内部服务器错误：' + err
            });
        };
        if (result) {
            return res.json({
                code: 'OK',
                msg: '数据获取成功！在data中',
                data: result
            });
        } else {
            return res.json({
                code: 'ERR',
                msg: '没有找到符合条件的数据'
            });
        };
    })
}

var people_get_by_id = function(req, res) {
    var i18n = req.i18n;
    var client = req.user.client.id;
    var people_id = req.params.people_id;
    People.findById(people_id).populate('company ou position').exec(function(err, people) {
        if (err) {
            return res.json({
                code: 'ERR',
                msg: '内部服务器错误：' + err
            });
        } else {
            return res.json({
                code: 'OK',
                msg: '数据获取成功，见data字段。',
                data: people
            });
        };
    })
}


var people_filter_typeahead = function(req, res) {
    var i18n = req.i18n;
    var client = req.user.client.id;
    async.waterfall([

        function(cb) {
            SocialInsuranceAccount.find({
                client: client,
            }, function(err, socialinsuranceaccounts) {
                if (err) {
                    res.json({
                        code: 'ERR',
                        msg: '内部服务器错误：' + err
                    });
                };
                if (socialinsuranceaccounts) {
                    var items = [];
                    us.each(socialinsuranceaccounts, function(hd) {
                        items.push(hd.people);
                    })
                    cb(null, items)
                };
            })
        },
        function(peoples, cb) {
            People.find({
                client: client,
                _id: {
                    $nin: peoples
                }
            }, cb)
        }
    ], function(err, peoples) {
        if (err) {
            res.json({
                code: 'ERR',
                msg: '内部服务器错误：' + err
            });
        };
        var ret = [];
        for (var i = 0; i < peoples.length; i++) {
            ret.push({
                id: peoples[i].id,
                code: peoples[i].people_no,
                name: peoples[i].full_name,
            });
        };
        res.json(ret);
    })

}
var people_filter_inputhelp = function(req, res) {
    var i18n = req.i18n;
    var client = req.user.client.id;
    async.waterfall([

        function(cb) {
            SocialInsuranceAccount.find({
                client: client,
            }, function(err, socialinsuranceaccounts) {
                if (err) {
                    res.json({
                        code: 'ERR',
                        msg: '内部服务器错误：' + err
                    });
                };
                if (socialinsuranceaccounts) {
                    var items = [];
                    us.each(socialinsuranceaccounts, function(hd) {
                        items.push(hd.people);
                    })
                    cb(null, items)
                };
            })
        },
        function(peoples, cb) {
            People.find({
                client: client,
                _id: {
                    $nin: peoples
                }
            }, cb)
        }
    ], function(err, peoples) {
        if (err) {
            res.json({
                code: 'ERR',
                msg: '内部服务器错误：' + err
            });
        };
        res.render('admin/masterdata/people/people/input_help', {
            peoples: peoples
        });

    })
}
var people_life_cycle = function(req, res) {
    var i18n = req.i18n;
    var client = req.user.client.id;
    var render_data = {
        title: '报表-员工的生命周期',
        user: req.user,
    };
    res.render('admin/masterdata/people/people/report_list', render_data);

}
var people_life_cycle_config_list = function(req, res) {
    var i18n = req.i18n;
    var client = req.user.client.id;
    var render_data = {
        title: '报表-员工的生命周期',
        user: req.user,
    };
    var types = ['J', 'H', 'C', 'S', 'D', 'P', 'T', 'E', 'G']
    async.times(types.length, function(n, next) {
        var find_create = {
            client: client,
            lift_cycle_type: types[n]
        }
        PeopleLifeCycleConfig.findOne(find_create, function(err, pcc) {
            if (pcc) {
                next(null, pcc)
            } else {
                PeopleLifeCycleConfig.create(find_create, next)
            }
        })
    }, function(err, result) {
        res.render('admin/masterdata/people/people/config_list', render_data);
    })
}
var people_life_cycle_config_pc_list = function(req, res) {
    var i18n = req.i18n;
    var client = req.user.client.id;
    PeopleLifeCycleConfig.find({
        client: client,
    }, function(err, ppcs) {
        if (err) {
            return res.json({
                code: 'ERR',
                msg: '内部服务器错误：' + err
            });
        } else {
            return res.json(ppcs);
        };
    })
}
var people_life_cycle_config_pc_update = function(req, res) {
    var i18n = req.i18n;
    var client = req.user.client.id;
    var up_id = req.params.up_id;
    PeopleLifeCycleConfig.findByIdAndUpdate(up_id, {
        lift_cycle_mark: req.body.lift_cycle_mark
    }, function(err, ppc) {
        if (err) {
            return res.status(500).json({
                code: 'ERR',
                msg: '内部服务器错误：' + err
            });
        };
        if (ppc) {
            return res.json({
                code: 'OK',
                msg: '保存成功！',
                _id: ppc._id,
            });
        } else {
            return res.status(500).json({
                code: 'ERR',
                msg: '保存失败'
            });
        };
    })

}
var get_people_life_cycle_json = function(req, res) {
    var client = req.user.client.id;
    console.log(client);
    var people_id = req.params.people_id;
    async.parallel({
        pplc: function(cb) {
            PeopleLifeCycle.findOne({
                client: client,
                people: people_id
            }, cb)
        },
        plccs: function(cb) {
            PeopleLifeCycleConfig.find({
                client: client
            }, function(err, plccs) {
                var lift_cycle_mark = [];
                var lift_cycle_type = [];
                _.each(plccs, function(p) {
                    lift_cycle_type.push(p.lift_cycle_type);
                    lift_cycle_mark.push(p.lift_cycle_mark)
                });
                cb(null, _.object(lift_cycle_type, lift_cycle_mark))
            })
        },
        people: function(cb) {
            People.findById(people_id).populate('it_0003 it_0006').exec(cb)
        },
        paevents: function(cb) {
            PAEvent.find({
                client: client,
                people: people_id
            }).populate('pa_event pa_reason people position psr esg').exec(cb)
        },
        pyadjustsingles: function(cb) {
            PYAdjustSingle.find({
                client: client,
                people: people_id
            }).exec(cb)
        },
        pyadjustbulks: function(cb) {
            PYAdjustBulk.find({
                client: client,
                peoples: {
                    $all: [people_id]
                }
            }).exec(cb)
        },
        assessmentinstances: function(cb) {
            AssessmentInstance.find({
                client: client,
                people: people_id
            }).populate('period').exec(cb)
        },
        questions: function(cb) {
            Questionnair360AndCAInstance.find({
                client: client,
                people: people_id
            }).populate('position period').exec(cb)
        },
        companypays: function(cb) {
            CompanyPayrollVerify.find({
                client: client,
                'people_payroll.people': people_id
            }).populate('people_payroll.items.pri').exec(cb)
        },
        talentlambdas: function(cb) {
            TalentLambda.find({
                client: client,
                'lambda_data.people': people_id
            }, cb)
        }
    }, function(err, result) {
        if (err) {
            return res.status(500).json({
                code: 'ERR',
                msg: '内部服务器错误：' + err
            });
        };
        return res.json({
            code: 'OK',
            result: result,
            plccs: result.plccs,
            pplc: result.pplc,
        });

    })
}
var get_event_json = function(req, res) {
    var client = req.user.client.id;
    var people_id = req.params.people_id;
    var item = [
        'life_cycles_event.paevent',
        'life_cycles_event.it_0003',
        'life_cycles_event.it_0006',
        'life_cycles_event.pyadjustsingle',
        'life_cycles_event.pyadjustbulk',
        'life_cycles_event.assessmentinstance',
        'life_cycles_event.questionnair360',
        'life_cycles_event.companypayrollverify',
        'life_cycles_event.talentlambda',
        'people'
    ]
    async.parallel({
        pplc: function(cb) {
            EmpLifeCycle.findOne({
                client: client,
                people: people_id
            }).populate(item.join(' ')).exec(cb)
        },
        plccs: function(cb) {
            PeopleLifeCycleConfig.find({
                client: client
            }, function(err, plccs) {
                var lift_cycle_mark = [];
                var lift_cycle_type = [];
                _.each(plccs, function(p) {
                    lift_cycle_type.push(p.lift_cycle_type);
                    lift_cycle_mark.push(p.lift_cycle_mark)
                });
                cb(null, _.object(lift_cycle_type, lift_cycle_mark))
            })
        },
        assessmentinstances: function(cb) {
            AssessmentInstance.find({
                client: client,
                people: people_id
            }).populate('period').exec(cb)
        },
        pay_item: function(cb) {
            PayrollItemClient.findOne({
                client: client,
                pri_category: '3'
            }).exec(cb)
        },
        positions: function(cb) {
            Position.find({
                client: client,
            }).exec(cb)
        }
    }, function(err, result) {
        if (err) {
            return res.status(500).json({
                code: 'ERR',
                msg: '内部服务器错误：' + err
            });
        };
        return res.json({
            code: 'OK',
            result: result,
        });

    })
}

var people_download_json = function(req, res) {
    var i18n = req.i18n;
    var client = req.user.client.id;
    var state = req.query.state;
    var datas = req.query.datas.split(',');
    var cond = {
        client: client,
    };
    if (state == 'CP') {
        cond.company = {
            $in: datas
        }
    } else if (state == 'JL') {
        cond.joblevel = {
            $in: datas
        }
    } else if (state == 'JR') {
        cond.jobrank = {
            $in: datas
        }
    } else if (state == 'JN') {
        var items = [];
        _.each(datas, function(j) {
            var obj = {};
            if (j == '1') {
                obj.position_manager = true;
            } else if (j == '2') {
                obj.position_is_knowledge = true;
            } else if (j == '3') {
                obj.position_is_key = true;
            } else if (j == '4') {
                obj.position_manager = false;
                obj.position_is_knowledge = false;
                obj.position_is_key = false;
            };
            items.push(obj)
        })
        cond.$or = items;
    } else if (state == 'JQ') {
        cond.jobsequence = {
            $in: datas
        }
    } else if (state == 'ES') {
        var is_normals = [];
        var items = [];
        _.each(datas, function(j) {
            var obj = {}
            if (j == '1') {
                obj.block = false;
                is_normals.push(obj)
            } else if (j == '2') {
                obj.block = true;
                is_normals.push(obj)
            } else if (j == '3') {
                items.push('P');
            } else if (j == '4') {
                items.push('H');
            } else if (j == '5') {
                items.push('L');
            } else if (j == '6') {
                items.push('R');
            }

        })
        if (is_normals.length > 0) {
            cond.$or = is_normals;
        };
        if (items.length > 0) {
            cond.employee_status = {
                $in: items
            }
        };
    } else if (state == 'GS') {
        cond.gender = {
            $in: datas
        };
    } else if (state == 'HP') {
        var items = [];
        _.each(datas, function(j) {
            var obj = {};
            if (j == '1') {
                obj.has_parttime_positions = true;
            } else if (j == '2') {
                obj.has_parttime_positions = false;
            }
            items.push(obj)
        })
        cond.$or = items;
    } else if (state == 'OS') {
        cond.ou = {
            $in: datas
        }
    };
    var conf = {};
    var people_status_title = {
        'P': '试用期',
        'H': '正式雇佣',
        'L': '停薪留职',
        'R': '已离职'
    };
    conf.cols = [{
        caption: '任职状态',
        type: 'string'
    }, {
        caption: '工 号',
        type: 'string'
    }, {
        caption: '姓 名',
        type: 'string'
    }, {
        caption: '性 别',
        type: 'string'
    }, {
        caption: '生 日',
        type: 'string'
    }, {
        caption: '邮 件',
        type: 'string'
    }, {
        caption: '电 话',
        type: 'string'
    }, {
        caption: '职 位',
        type: 'string'
    }, {
        caption: '部 门',
        type: 'string'
    }, {
        caption: '公 司',
        type: 'string'
    }];
    People.find(cond, function(err, peoples) {
        if (err) {
            return res.send(500, err)
        };
        conf.rows = [];
        for (var i = 0; i < peoples.length; i++) {
            var birthday = moment(peoples[i].birthday).format('YYYY-MM-DD')
            conf.rows.push([
                people_status_title[peoples[i].employee_status],
                peoples[i].people_no,
                peoples[i].people_name,
                peoples[i].gender == 'M' ? '男' : '女',
                birthday,
                peoples[i].email,
                peoples[i].cell,
                peoples[i].position_name || '',
                peoples[i].ou_name || '',
                peoples[i].company_name || '',
            ])
        };

        var result = excel_maker.execute(conf);
        var fname = encodeURIComponent('员工清单.xlsx')
        res.setHeader('Content-Type', 'application/vnd.openxmlformats');
        res.setHeader("Content-Disposition", "attachment; filename=" + fname);
        res.end(result, 'binary');
    })


    // async.waterfall([

    //     function(cb) {
    //         People.find(cond, cb)
    //     },
    //     function(peoples, cb) {
    //         async.times(peoples.length, function(n, next) {
    //             var people = peoples[n];
    //             GridFile.findById(people.avatar, function(err, gf) {
    //                 var birthday = moment(people.birthday).format('YYYY-MM-DD')
    //                 var avatar = null;
    //                 if (gf) {
    //                     avatar = gfs.createReadStream({
    //                         _id: gf.id
    //                     });

    //                 }
    //                 var items = [
    //                     avatar,
    //                     people_status_title[people.employee_status],
    //                     people.people_no,
    //                     people.people_name,
    //                     people.gender == 'M' ? '男' : '女',
    //                     birthday,
    //                     people.email,
    //                     people.cell,
    //                     people.position_name || '',
    //                     people.ou_name || '',
    //                     people.company_name || '',
    //                 ]
    //                 // console.log(items);
    //                 next(null, items)
    //             })
    //         }, cb)

    //     }
    // ], function(err, result) {
    //     // console.log(result);
    //     conf.rows = result
    //     var result = excel_maker.execute(conf);
    //     var fname = encodeURIComponent('员工清单.xlsx')
    //     res.setHeader('Content-Type', 'application/vnd.openxmlformats');
    //     res.setHeader("Content-Disposition", "attachment; filename=" + fname);
    //     res.end(result, 'binary');
    // })

}

var people_list4m = function(req, res) {
    var i18n = req.i18n;
    var client = req.user.client.id;
    var people_id = req.query.people || req.user.people || null;
    var my_team_all = []; //全部下属的人员id清单。
    async.waterfall([

        function(cb) {
            if (typeof(people_id) == 'string') { //people_id
                People.findById(people_id, cb);
            } else {
                cb(null, people_id); //已经是对象了，后面直接用
            };
        },
        function(people_obj, cb) {
            my_team_all = people_obj.my_team;
            Position.find({
                $or: [{
                    position_direct_superior: people_obj.position //直接领导
                }, {
                    position_indirect_superior: people_obj.position //间接领导
                }]
            }).populate('belongto_ou').exec(cb);
        },
        function(pos, cb) {
            People
                .find({
                    client: client,
                    employee_status: {
                        $in: ['P', 'H']
                    },
                })
                .populate('history_position.position')
                .select('_id people_no firstname lastname people_name avatar email tel cell company_name ou_name position_name position start_service_date years_of_service_client history_position')
                .sort({
                    'firstname': 1,
                    'lastname': 1,
                    'people_no': 1,
                })
                .exec(function(err, people) {
                    if (err) {
                        cb(err, null);
                    } else {
                        var ret = _.map(people, function(x) {
                            // 处理直接下属
                            var found = _.find(pos, function(p) {
                                return x.position == p._id + '';
                            })
                            var tmp = x.toJSON();
                            if (found) {
                                tmp.myteam = true;
                            } else {
                                delete tmp.position;
                            };
                            // 处理全部下属
                            var found = _.find(my_team_all, function(t) {
                                return x._id == t + '';
                            })
                            if (found) {
                                tmp.myteama = true;
                            };
                            // 处理姓名首字母
                            tmp.fl = pinyin(x.people_name[0], {
                                style: pinyin.STYLE_FIRST_LETTER
                            })[0][0].toUpperCase();
                            delete tmp.firstname;
                            delete tmp.lastname;
                            // console.log(pinyin('哈哈abcdefg',{ style: pinyin.STYLE_FIRST_LETTER}));
                            // 处理历任职位
                            if (tmp.history_position.length) {
                                for (var i = 0; i < tmp.history_position.length; i++) {
                                    var t = tmp.history_position[i];
                                    t.position_name = t.position.position_name;
                                    t.start_time = new Date(t.current_time);
                                    if (i < tmp.history_position.length - 1) {
                                        t.end_time = new Date(tmp.history_position[i + 1].current_time)
                                    } else {
                                        t.end_time = new Date('9999-12-31');
                                    };
                                    delete t.position;
                                };
                                tmp.history_position.reverse();
                            };
                            return tmp;
                        })

                        cb(null, ret);
                    };
                })
        }
    ], function(err, result) {
        if (err) {
            res.status(500);
            res.send({
                code: 'ERR',
                msg: err
            })
        } else {
            res.send(result);
        };
    })

}

module.exports = function(app, checkAuth) {
    var __base_path = '/admin/masterdata/people';
    app.get(__base_path + '/list', checkAuth, people_list);
    app.post(__base_path + '/list_json', checkAuth, people_list_json);
    app.get(__base_path + '/add', checkAuth, people_add_form);
    app.post(__base_path + '/add', checkAuth, people_add_save);

    app.get(__base_path + '/edit_sc', checkAuth, people_edit_sc_form);
    app.post(__base_path + '/edit_sc', checkAuth, people_edit_sc_manipulate);
    app.get(__base_path + '/edit/:people_id', checkAuth, people_edit_form);
    app.post(__base_path + '/edit', checkAuth, people_edit_save);
    app.post(__base_path + '/avatar', checkAuth, people_avatar_save);

    // app.post(__base_path + '/del', checkAuth, people_del);

    app.post(__base_path + '/typeahead', checkAuth, people_typeahead)
    app.get(__base_path + '/input_help', checkAuth, people_inputhelp)

    app.get('/view_profile/:people_id', checkAuth, people_view_profile);

    app.post(__base_path + '/toggle_block', checkAuth, people_toggle_block)

    app.get(__base_path + '/get_my_team', checkAuth, people_get_my_team)
    app.get(__base_path + '/get_all_team', checkAuth, people_get_all_team)
    app.get(__base_path + '/get_team_by_people/:people_id', checkAuth, get_team_by_people)

    app.get(__base_path + '/get/:people_id', checkAuth, people_get_by_id)
    app.post(__base_path + '/filter_typeahead', checkAuth, people_filter_typeahead)
    app.get(__base_path + '/filter_input_help', checkAuth, people_filter_inputhelp)

    //员工生命周期
    app.get(__base_path + '/people_life_cycle', checkAuth, people_life_cycle);
    //生命周期的配置
    app.get(__base_path + '/people_life_cycle_config_list', checkAuth, people_life_cycle_config_list);

    app.get(__base_path + '/pc', checkAuth, people_life_cycle_config_pc_list); //列表界面
    app.put(__base_path + '/pc/:up_id', checkAuth, people_life_cycle_config_pc_update); //更新的保存

    app.get(__base_path + '/get_people_life_cycle_json/:people_id', checkAuth, get_people_life_cycle_json);
    app.get(__base_path + '/get_event_json/:people_id', checkAuth, get_event_json)
    //导 出
    app.get(__base_path + '/people_download_json', checkAuth, people_download_json);

    //移动版本相关
    app.get(__base_path + '/people_list4m', checkAuth, people_list4m);

    // // route for people

    require('./it_0001')(app, checkAuth); //婚育情况
    require('./it_0002')(app, checkAuth); //地址信息
    require('./it_0003')(app, checkAuth); //合同信息
    require('./it_0004')(app, checkAuth); //家庭成员
    require('./it_0005')(app, checkAuth); //教育经历
    require('./it_0006')(app, checkAuth); //工作经历
    require('./it_0007')(app, checkAuth); //人事档案
    require('./it_0008')(app, checkAuth); //政党信息
    require('./it_0009')(app, checkAuth); //体检信息
    require('./it_0010')(app, checkAuth); //伤残信息
    // require('./it_0011')(app, checkAuth); //宗教信息

}
