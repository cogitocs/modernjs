var sprintf = require('sprintf').sprintf;
var Client = require('../../models/client').Client;
var PayrollProcedure = require('../../models/payroll').PayrollProcedure;
var PayrollPeopleInstance = require('../../models/payroll').PayrollPeopleInstance;
var ReportOrderConfig = require('../../models/payroll').ReportOrderConfig;
var PayrollItemClient = require('../../models/payroll').PayrollItemClient;
var async = require('async');
var us = require('underscore');
var OrganizationUnit = require('../../models/organization').OrganizationUnit;
var Company = require('../../models/structure').Company;
var moment = require('moment');
var rt_002_list = function(req, res) {
    var i18n = req.i18n;
    var client = req.user.client.id;
    var render_data = {
        title: '月度薪酬汇总表',
        user: req.user,
        _: us,
    };
    render_data.year = moment().format('YYYY');
    render_data.month = moment().subtract('month', 1).format('MM');
    res.render('admin/py/payroll_report/rt_002', render_data);

}

    function title_data(req, cb) {
        // var company = req.body.company;
        var client = req.user.client.id;
        var period = req.body.period;
        // console.log(period);
        var start_date = moment().format('YYYY');
        var front_month_date = moment().subtract('month', 1).format('YYYYMM');
        var front_star_date_year = moment().subtract('year', 1).format('YYYY');

        async.waterfall([

            function(cb) {
                Client.findById(
                    client
                ).exec(function(err, result) {
                    // var pay_start_date = result.config.payroll.pay_start_date
                    // var date = moment(new Date()).format('YYYY-MM');
                    // var validTo = moment(date).add('day', pay_start_date - 1).format('YYYY-MM-DD');
                    // var validFrom = moment(validTo).subtract('months', 1).format('YYYY-MM-DD');

                    var pay_start_date = req.user.client.config.payroll.pay_start_date;
                    var date = moment(new Date()).format('YYYY-MM');

                    var validFrom = moment(date).subtract('months', 1).format('YYYY-MM-DD');
                    validFrom = moment(validFrom).add('day', parseInt(pay_start_date) - 1).format('YYYY-MM-DD');

                    var validTo = moment(validFrom).add('months', 1).format('YYYY-MM-DD');
                    validTo = moment(validTo).subtract('day', 1).format('YYYY-MM-DD')

                    var obj = {};
                    obj.validFrom = validFrom;
                    obj.validTo = validTo;
                    cb(null, obj);
                })
            },
            function(obj, cb) {
                async.parallel({
                    client: function(cb) {
                        Client.findById(
                            client
                        ).populate('config.payrolls_order.pri').exec(cb)
                    },
                    order: function(cb) {
                        ReportOrderConfig.findOne({
                            client: client
                        }).populate('payrolls_order').exec(cb)
                    },
                    compans: function(cb) {
                        Company.find({
                            _id: {
                                $in: req.user.companies
                            },
                        }, cb)
                    },
                    pp_instances: function(cb) {
                        PayrollPeopleInstance.find({
                            client: client,
                            // pay_start: obj.validFrom,
                            // pay_end: obj.validTo
                        }).populate('people items.pri').exec(cb);
                    },
                    procedures: function(cb) {
                        PayrollProcedure.find({
                            client: client
                        }).populate('result procedure.operand').exec(cb)
                    }
                }, cb)
            },
            function(datas, cb) {
                var companys = datas.compans;
                var pp_instances = datas.pp_instances;
                //取小计项排序号
                var client_order = datas.client.config.payrolls_order;
                var order_pris = datas.order.payrolls_order;
                var procedures = datas.procedures;
                var pp_instancess = us.filter(pp_instances, function(obj) {
                    return moment(obj.pay_start).format("YYYYMM") == period;
                })
                var pp_instancess_year = us.filter(pp_instances, function(obj) {
                    return moment(obj.pay_start).add('year', 1).format("YYYYMM") == period;
                })
                var pp_instancess_month = us.filter(pp_instances, function(obj) {
                    return moment(obj.pay_start).add('month', 1).format("YYYYMM") == period;
                })
                //取今年整年的数据
                var pp_instancess_now_year = us.filter(pp_instances, function(obj) {
                    return moment(obj.pay_start).format("YYYY") == period.substring(-1, 4);
                })
                //取上一年的数据
                var pp_instancess_last_year = us.filter(pp_instances, function(obj) {
                    return moment(obj.pay_start).add('year', 1).format("YYYY") == period.substring(-1, 4);
                })
                var objs = us.groupBy(pp_instancess, function(fd) {
                    return moment(fd.pay_start).format("YYYYMM");
                })
                var objs_year = us.groupBy(pp_instancess_year, function(fd) {
                    return moment(fd.pay_start).format("YYYYMM");
                })
                var objs_month = us.groupBy(pp_instancess_month, function(fd) {
                    return moment(fd.pay_start).format("YYYYMM");
                })
                var objs_now_year = us.groupBy(pp_instancess_now_year, function(fd) {
                    return moment(fd.pay_start).format("YYYYMM");
                })
                var objs_last_year = us.groupBy(pp_instancess_last_year, function(fd) {
                    return moment(fd.pay_start).format("YYYYMM");
                })

                var items = [];
                for (key in objs) {
                    var new_obj = {};
                    new_obj.period = key;
                    new_obj.data = objs[key];
                    items.push(new_obj)
                }
                var items_year = [];
                for (key in objs_year) {
                    var new_obj_year = {};
                    new_obj_year.period = key;
                    new_obj_year.data = objs_year[key];
                    items_year.push(new_obj_year)
                }
                var items_month = [];
                for (key in objs_month) {
                    var new_obj_month = {};
                    new_obj_month.period = key;
                    new_obj_month.data = objs_month[key];
                    items_month.push(new_obj_month)
                }
                var items_now_year = [];
                for (key in objs_now_year) {
                    // console.log(key);
                    var new_obj_now_year = {};
                    new_obj_now_year.period = key;
                    new_obj_now_year.data = objs_now_year[key];
                    items_now_year.push(new_obj_now_year)
                }
                var items_last_year = [];
                for (key in objs_last_year) {
                    // console.log(key);
                    var new_obj_last_year = {};
                    new_obj_last_year.period = key;
                    new_obj_last_year.data = objs_last_year[key];
                    items_last_year.push(new_obj_last_year)
                }
                // console.log(items_now_year[1].period);
                async.times(items.length, function(n, next) {
                    var item = items[n];
                    var result_obj = {};
                    // result_obj.company = company;
                    result_obj.period = item.period;

                    var rt_datas = item.data;

                    async.times(companys.length, function(n, next) {
                        var rt_datas_month, rt_datas_year;
                        if (items_year.length > 0 && items_year[0].data != undefined) {
                            rt_datas_year = items_year[0].data;
                            result_obj.sequential_year = true;
                        } else {
                            result_obj.sequential_year = null;
                        };
                        if (items_month.length > 0 && items_month[0].data != undefined) {
                            rt_datas_month = items_month[0].data;
                            result_obj.sequential_month = true;
                        } else {
                            result_obj.sequential_month = null;
                        }
                        var cp = companys[n];
                        var ft = us.filter(rt_datas, function(rd) {
                            return String(rd.people.company) == cp._id
                        })


                        //-----------------------------系统自定义的优先级排序-------------------------//
                        if (order_pris.length > 0) {

                            var order_num = [];
                            var order_pri = [];
                            var order_pri_name = [];
                            //取实发工资ID
                            var order_priss = us.filter(order_pris, function(temp) {
                                return temp.pri_category != '1'
                            })
                            var real_pay_id = us.find(order_priss, function(temp) {
                                return temp.pri_category == '3'
                            })
                            // console.log(real_pay_id.pri.id);
                            //取序号和工资项ID
                            us.each(order_priss, function(order) {
                                order_num.push(order_priss.indexOf(order));
                                order_pri.push(order.id);
                                order_pri_name.push(order.pri_name)
                            })
                            var order_object = us.object(order_num, order_pri);
                            var order_num_name_object = us.object(order_pri, order_pri_name);
                            var order_object_sort = us.sortBy(order_object, function(s) {
                                return s.order_num
                            })
                            var arr_total1 = [],
                                arr_total2 = [];
                            var pri_obj = function(pri) {
                                var obj_val = 0;
                                us.each(ft, function(f) {
                                    var ft_value = us.find(f.items, function(pro) {
                                        return pro.pri.id == String(pri)
                                    })
                                    if (ft_value) {
                                        return obj_val += ft_value.amount;
                                    } else {
                                        return obj_val = 0;
                                    }
                                })
                                return obj_val;
                            }
                            us.each(order_object_sort, function(sort) {
                                arr_total1.push(pri_obj(sort));
                                arr_total2.push(order_num_name_object[sort]);
                            })
                            //公司工资项ID和工资项值一一对应
                            var company_pri_value_obj = us.object(order_object_sort, arr_total1);
                            var company_name_value_obj = us.object(arr_total2, arr_total1);
                            var company_pri_name_obj = us.object(order_object_sort, arr_total2)

                            // console.log(company_pri_name_obj);
                            //---------------------同环比数据过滤----------------
                            var company_pri_value_obj_year, company_pri_value_obj_month;
                            if (rt_datas_year) {
                                var ft_data_year = us.filter(rt_datas_year, function(temp) {
                                    return String(temp.people.company) == cp._id
                                })
                                var pri_obj_year = function(pri) {
                                    var obj_val_year = 0;
                                    us.each(ft_data_year, function(f) {
                                        var ft_value_year = us.find(f.items, function(pro) {
                                            return pro.pri.id == String(pri)
                                        })
                                        // console.log(ft_value);
                                        if (ft_value_year) {
                                            return obj_val_year += ft_value_year.amount;
                                        } else {
                                            return obj_val_year = 0;
                                        }
                                    })
                                    return obj_val_year;
                                }
                                var arr_total_year1 = [];
                                // arr_total_year2 = [];
                                us.each(order_object_sort, function(sort_id) {
                                    arr_total_year1.push(pri_obj(sort_id) - pri_obj_year(sort_id));
                                })
                                company_pri_value_obj_year = us.object(order_object_sort, arr_total_year1)
                            }
                            if (rt_datas_month) {
                                var ft_data_month = us.filter(rt_datas_month, function(temp) {
                                    return String(temp.people.company) == cp._id
                                })
                                var arr_total_month1 = [];
                                var pri_obj_month = function(pri) {
                                    var obj_val_month = 0;
                                    us.each(ft_data_month, function(f) {
                                        var ft_value_month = us.find(f.items, function(pro) {
                                            return pro.pri.id == String(pri)
                                        })
                                        // console.log(ft_value);
                                        if (ft_value_month) {
                                            return obj_val_month += ft_value_month.amount;
                                        } else {
                                            return obj_val_month = 0;
                                        }
                                    })
                                    return obj_val_month;
                                }
                                us.each(order_object_sort, function(sort_id) {
                                    arr_total_month1.push(pri_obj(sort_id) - pri_obj_month(sort_id));
                                })
                                company_pri_value_obj_month = us.object(order_object_sort, arr_total_month1)

                            }
                            //取上一年累计实发工资之和
                            var real_pay_wage_count_last_year = 0;
                            us.each(items_last_year, function(last) {
                                var ft_data_last_year = us.filter(last.data, function(temp) {
                                    return String(temp.people.company) == cp._id
                                })
                                var arr_total_last_year = [];
                                var pri_obj_last_year = function(pri) {
                                    var obj_val_last_year = 0;
                                    us.each(ft_data_last_year, function(f) {
                                        var ft_value_last_year = us.find(f.items, function(pro) {
                                            return pro.pri.id == String(pri)
                                        })
                                        // console.log(ft_value);
                                        if (ft_value_last_year) {
                                            return obj_val_last_year += ft_value_last_year.amount;
                                        } else {
                                            return obj_val_last_year = 0;
                                        }
                                    })
                                    return obj_val_last_year;
                                }
                                real_pay_wage_count_last_year += pri_obj_last_year(real_pay_id.id);
                            })
                            //取当年累计实发工资合计之和
                            var real_pay_wage_count_year = 0;
                            us.each(items_now_year, function(now) {
                                var ft_data_now_year = us.filter(now.data, function(temp) {
                                    return String(temp.people.company) == cp._id
                                })
                                var arr_total_now_year = [];
                                var pri_obj_now_year = function(pri) {
                                    var obj_val_now_year = 0;
                                    us.each(ft_data_now_year, function(f) {
                                        var ft_value_now_year = us.find(f.items, function(pro) {
                                            return pro.pri.id == String(pri)
                                        })
                                        // console.log(ft_value);
                                        if (ft_value_now_year) {
                                            return obj_val_now_year += ft_value_now_year.amount;
                                        } else {
                                            return obj_val_now_year = 0;
                                        }
                                    })
                                    return obj_val_now_year;
                                }
                                real_pay_wage_count_year += pri_obj_now_year(real_pay_id.id);
                            })

                            //--------------------------------人数--人均值 及同环比数据-----------------------//
                            var people_count = ft.length;
                            if (people_count == 0) {
                                var this_month_divide = 0;
                                var last_month_divide = 0;
                                var last_year_divide = 0;
                            } else {
                                var this_month_divide = pri_obj(real_pay_id.id) / people_count;
                                if (pri_obj_month) {
                                    var last_month_divide = pri_obj_month(real_pay_id.id) / people_count;

                                } else {
                                    var last_month_divide = 0;
                                }
                                if (last_year_divide) {
                                    var last_year_divide = pri_obj_year(real_pay_id.id) / people_count;

                                } else {
                                    var last_year_divide = 0;
                                }
                            }

                            var ou_obj = {};
                            ou_obj.company_name = cp.company_name;
                            ou_obj.company_code = cp.company_code;
                            ou_obj.company = cp._id;
                            ou_obj.company_id_value = company_pri_value_obj;
                            ou_obj.company_name_value = company_name_value_obj;
                            ou_obj.company_id_name = company_pri_name_obj;
                            ou_obj.company_id = order_object_sort;
                            if (company_pri_value_obj_year) {
                                ou_obj.company_pri_value_obj_year = company_pri_value_obj_year;
                            } else {
                                ou_obj.company_pri_value_obj_year = null;
                            }
                            if (company_pri_value_obj_month) {
                                ou_obj.company_pri_value_obj_month = company_pri_value_obj_month;
                            } else {
                                ou_obj.company_pri_value_obj_month = null;
                            }
                            ou_obj.real_pay_wage_count_year = real_pay_wage_count_year;
                            ou_obj.sequential_total_year = real_pay_wage_count_year - real_pay_wage_count_last_year;
                            ou_obj.people_count = people_count;
                            ou_obj.people_divide = this_month_divide;
                            ou_obj.people_sequential = this_month_divide - last_month_divide;
                            ou_obj.people_sequential_year = this_month_divide - last_year_divide;
                            // console.log(ou_obj);
                            next(null, ou_obj)

                        } else {
                            //-----------------------在计算公式里边得到小计总计项的顺序排列------------------//
                            var result = [];
                            var procedure = [];
                            us.each(procedures, function(temp) {
                                result.push(temp.result);
                                procedure.push(temp.procedure);
                            })
                            //分装结果ID 和 计算步骤
                            var result_procedure = us.object(result, procedure);
                            //取得实发合计项
                            var pay_real_result = us.find(procedures, function(temp) {
                                return temp.procedure.indexOf(temp.result)
                            })
                            var pay_result = us.find(procedures, function(temp) {
                                return temp.result.pri_category == '3'
                            })
                            //the step array of pay_real_result
                            //the operand_id of pay_real_result
                            var operand_id_real_result = [];
                            //the sign of pa_real_result
                            var total_array = []; //存放键值对的总数组
                            var step_real_result = [];
                            var operand_id_name_result = [];
                            //得到小计项的步骤和ID(operand)
                            us.each(pay_real_result.procedure, function(temp) {
                                step_real_result.push(temp.step);
                                operand_id_real_result.push(temp.operand.id);
                                operand_id_name_result.push(temp.operand.pri_name);
                                // sign_real_result.push(temp.sign);
                            })
                            //  取结果项的步骤
                            var result_step = us.last(step_real_result) + 1;
                            step_real_result.push(result_step);
                            //小计和合计项的ID&名称
                            operand_id_real_result.push(pay_result.result.id);
                            operand_id_name_result.push(pay_result.result.pri_name);
                            var order_id_name_object = us.object(operand_id_real_result, operand_id_name_result)
                            //将步骤和id 组装成对象
                            var step_id = us.object(step_real_result, operand_id_real_result);
                            var sort_object = us.sortBy(step_id, function(temp) {
                                return step_real_result
                            })
                            //------------------------------------------------------------//            
                            var arr_total_pro1 = [],
                                arr_total_pro2 = [];
                            var pri_obj_procedure = function(pri) {
                                var obj_val = 0;
                                us.each(ft, function(f) {
                                    var ft_value = us.find(f.items, function(pro) {
                                        return pro.pri.id == String(pri)
                                    })
                                    // console.log(ft_value);
                                    if (ft_value) {
                                        return obj_val += ft_value.amount;
                                    } else {
                                        return obj_val = 0;
                                    }
                                })
                                return obj_val;
                            }
                            us.each(sort_object, function(sort) {
                                arr_total_pro1.push(pri_obj_procedure(sort));
                                arr_total_pro2.push(order_id_name_object[sort]);
                            })
                            var company_pri_value_obj = us.object(sort_object, arr_total_pro1);
                            var company_name_value_obj = us.object(arr_total_pro2, arr_total_pro1);
                            var company_pri_name_obj = us.object(sort_object, arr_total_pro2)
                            //---------------------同环比数据过滤----------------
                            var company_pri_value_obj_year, company_pri_value_obj_month;
                            if (rt_datas_year) {
                                var ft_data_year = us.filter(rt_datas_year, function(temp) {
                                    return String(temp.people.company) == cp._id
                                })
                                var pri_obj_year = function(pri) {
                                    var obj_val_year = 0;
                                    us.each(ft_data_year, function(f) {
                                        var ft_value_year = us.find(f.items, function(pro) {
                                            return pro.pri.id == String(pri)
                                        })
                                        // console.log(ft_value);
                                        if (ft_value_year) {
                                            return obj_val_year += ft_value_year.amount;
                                        } else {
                                            return obj_val_year = 0;
                                        }
                                    })
                                    return obj_val_year;
                                }
                                var arr_total_year1 = [];
                                // arr_total_year2 = [];
                                us.each(sort_object, function(sort) {
                                    arr_total_year1.push(pri_obj_procedure(sort) - pri_obj_year(sort));
                                })
                                company_pri_value_obj_year = us.object(sort_object, arr_total_year1)
                            }
                            if (rt_datas_month) {
                                var ft_data_month = us.filter(rt_datas_month, function(temp) {
                                    return String(temp.people.company) == cp._id
                                })
                                var arr_total_month1 = [];
                                var pri_obj_month = function(pri) {
                                    var obj_val_month = 0;
                                    us.each(ft_data_month, function(f) {
                                        var ft_value_month = us.find(f.items, function(pro) {
                                            return pro.pri.id == String(pri)
                                        })
                                        // console.log(ft_value);
                                        if (ft_value_month) {
                                            return obj_val_month += ft_value_month.amount;
                                        } else {
                                            return obj_val_month = 0;
                                        }
                                    })
                                    return obj_val_month;
                                }
                                us.each(sort_object, function(sort) {
                                    arr_total_month1.push(pri_obj_procedure(sort) - pri_obj_month(sort));
                                })
                                company_pri_value_obj_month = us.object(sort_object, arr_total_month1)

                            }
                            //取上一年累计实发工资之和
                            var real_pay_wage_count_last_year = 0;
                            us.each(items_last_year, function(last) {
                                var ft_data_last_year = us.filter(last.data, function(temp) {
                                    return String(temp.people.company) == cp._id
                                })
                                var arr_total_last_year = [];
                                var pri_obj_last_year = function(pri) {
                                    var obj_val_last_year = 0;
                                    us.each(ft_data_last_year, function(f) {
                                        var ft_value_last_year = us.find(f.items, function(pro) {
                                            return pro.pri.id == String(pri)
                                        })
                                        // console.log(ft_value);
                                        if (ft_value_last_year) {
                                            return obj_val_last_year += ft_value_last_year.amount;
                                        } else {
                                            return obj_val_last_year = 0;
                                        }
                                    })
                                    return obj_val_last_year;
                                }
                                real_pay_wage_count_last_year += pri_obj_last_year(pay_result.result.id);
                            })
                            //取当年累计实发工资合计之和
                            var real_pay_wage_count_year = 0;
                            us.each(items_now_year, function(now) {
                                var ft_data_now_year = us.filter(now.data, function(temp) {
                                    return String(temp.people.company) == cp._id
                                })
                                var arr_total_now_year = [];
                                var pri_obj_now_year = function(pri) {
                                    var obj_val_now_year = 0;
                                    us.each(ft_data_now_year, function(f) {
                                        var ft_value_now_year = us.find(f.items, function(pro) {
                                            return pro.pri.id == String(pri)
                                        })
                                        // console.log(ft_value);
                                        if (ft_value_now_year) {
                                            return obj_val_now_year += ft_value_now_year.amount;
                                        } else {
                                            return obj_val_now_year = 0;
                                        }
                                    })
                                    return obj_val_now_year;
                                }
                                real_pay_wage_count_year += pri_obj_now_year(pay_result.result.id);
                            })
                            var people_count = ft.length;
                            if (people_count == 0) {
                                var this_month_divide = 0;

                                var last_month_divide = 0;
                                var last_year_divide = 0;

                            } else {

                                var this_month_divide = pri_obj_procedure(pay_result.result.id) / people_count;
                                if (pri_obj_month) {
                                    var last_month_divide = pri_obj_month(pay_result.result.id) / people_count;

                                } else {
                                    var last_month_divide = 0;
                                }
                                if (last_year_divide) {
                                    var last_year_divide = pri_obj_year(pay_result.result.id) / people_count;

                                } else {
                                    var last_year_divide = 0;
                                }

                            }
                            var ou_obj = {};
                            ou_obj.company_name = cp.company_name;
                            ou_obj.company_code = cp.company_code;
                            ou_obj.company = cp._id;
                            ou_obj.company_id_value = company_pri_value_obj;
                            ou_obj.company_name_value = company_name_value_obj;
                            ou_obj.company_id_name = company_pri_name_obj;
                            ou_obj.company_id = sort_object;
                            if (company_pri_value_obj_year) {
                                ou_obj.company_pri_value_obj_year = company_pri_value_obj_year;
                            } else {
                                ou_obj.company_pri_value_obj_year = null;
                            }
                            if (company_pri_value_obj_month) {
                                ou_obj.company_pri_value_obj_month = company_pri_value_obj_month;
                            } else {
                                ou_obj.company_pri_value_obj_month = null;
                            }
                            ou_obj.real_pay_wage_count_year = real_pay_wage_count_year;
                            ou_obj.sequential_total_year = real_pay_wage_count_year - real_pay_wage_count_last_year;
                            ou_obj.people_count = people_count;
                            ou_obj.people_divide = this_month_divide;
                            ou_obj.people_sequential = this_month_divide - last_month_divide;
                            ou_obj.people_sequential_year = this_month_divide - last_year_divide;
                            // console.log(ou_obj);
                            next(null, ou_obj)
                        }
                        // console.log(ft);
                    }, function(err, rest) {
                        result_obj.data = rest;
                        // console.log(result_obj);
                        next(null, result_obj)
                    })

                }, cb)
            }
        ], cb)
    }

var rt_002_search = function(req, res) {
    var company = req.body.company;
    var client = req.user.client.id;
    async.waterfall([

        function(cb) {
            async.parallel({
                title_data: function(cb) {
                    title_data(req, cb)
                },
                pp_instance: function(cb) {
                    PayrollPeopleInstance.find({
                        client: client
                    }).populate('people items.pri').exec(cb);
                }
            }, cb)
        },
        function(objs, cb) {
            // var obj = {};
            // obj.objs = objs.title_data;
            // console.log(obj);
            cb(null, objs.title_data)
        },

    ], function(err, result) {
        // console.log(result);
        if (err) {
            return res.json({
                code: 'ERR',
                msg: '内部服务器错误：' + err
            });
        };
        if (result) {
            return res.json({
                code: 'OK',
                pareports: result,
                // title_data: result.title_data
            })
        }
    })
}
var rt_002_ou_search = function(req, res) {
    var client = req.user.client.id;
    var company = req.body.company;
    var period = req.body.period;
    async.waterfall([

        function(cb) {
            OrganizationUnit.find({
                client: client,
                company: company
            }, cb)
        },
        function(ous, cb) {
            async.waterfall([

                function(cb) {
                    async.parallel({
                        pay_pps: function(cb) {
                            PayrollPeopleInstance.find({
                                client: client
                            }).populate('people items.pri').exec(cb);
                        },
                        order: function(cb) {
                            ReportOrderConfig.findOne({
                                client: client
                            }).populate('payrolls_order').exec(cb)
                        },
                        procedures: function(cb) {
                            PayrollProcedure.find({
                                client: client
                            }).populate('result procedure.operand').exec(cb)
                        }

                    }, cb)
                },
                function(pay_pp, cb) {
                    var pay_pps = pay_pp.pay_pps;
                    var order_pris = pay_pp.order.payrolls_order;
                    var procedures = pay_pp.procedures;
                    var pp_instances = us.filter(pay_pps, function(pay_pp) {
                        return String(pay_pp.people.company) == company;
                    })
                    //默认月份数据
                    var pp_instancess = us.filter(pp_instances, function(obj) {
                        return moment(obj.pay_start).format("YYYYMM") == period;
                    })
                    //月份同比数据 
                    var pp_instancess_year = us.filter(pp_instances, function(obj) {
                        return moment(obj.pay_start).add('year', 1).format("YYYYMM") == period;
                    })
                    //月份环比数据
                    var pp_instancess_month = us.filter(pp_instances, function(obj) {
                        return moment(obj.pay_start).add('month', 1).format("YYYYMM") == period;
                    })
                    //取今年整年的数据
                    var pp_instancess_now_year = us.filter(pp_instances, function(obj) {
                        return moment(obj.pay_start).format("YYYY") == period.substring(-1, 4);
                    })
                    //取上一年的数据
                    var pp_instancess_last_year = us.filter(pp_instances, function(obj) {
                        return moment(obj.pay_start).add('year', 1).format("YYYY") == period.substring(-1, 4);
                    })
                    async.times(ous.length, function(n, next) {
                        var ou_obj = {};
                        //用于判断同比 环比是否有数据
                        var rt_datas_month, rt_datas_year;
                        if (pp_instancess_year.length > 0 && pp_instancess_year != undefined) {
                            rt_datas_year = pp_instancess_year;
                            ou_obj.sequential_year = true;
                        } else {
                            ou_obj.sequential_year = null;
                        };
                        if (pp_instancess_month.length > 0 && pp_instancess_month != undefined) {
                            rt_datas_month = pp_instancess_month;
                            ou_obj.sequential_month = true;
                        } else {
                            ou_obj.sequential_month = null;
                        }
                        var ou = ous[n];
                        var ft = us.filter(pp_instancess, function(rd) {
                            return String(rd.people.ou) == ou._id
                        })
                        //-----------------------------系统自定义的优先级排序-------------------------//
                        if (order_pris.length > 0) {

                            var order_num = [];
                            var order_pri = [];
                            var order_pri_name = [];
                            //取实发工资ID
                            var order_priss = us.filter(order_pris, function(temp) {
                                return temp.pri_category != '1'
                            })
                            var real_pay_id = us.find(order_priss, function(temp) {
                                return temp.pri_category == '3'
                            })
                            //取序号和工资项ID
                            us.each(order_priss, function(order) {
                                order_num.push(order_priss.indexOf(order));
                                order_pri.push(order.id);
                                order_pri_name.push(order.pri_name)
                            })
                            var order_object = us.object(order_num, order_pri);
                            var order_num_name_object = us.object(order_pri, order_pri_name);
                            var order_object_sort = us.sortBy(order_object, function(s) {
                                return s.order_num
                            })
                            var arr_total1 = [],
                                arr_total2 = [];
                            var pri_obj = function(pri) {
                                var obj_val = 0;
                                us.each(ft, function(f) {
                                    var ft_value = us.find(f.items, function(pro) {
                                        return pro.pri.id == String(pri)
                                    })
                                    if (ft_value) {
                                        return obj_val += ft_value.amount;
                                    } else {
                                        return obj_val = 0;
                                    }
                                })
                                return obj_val;
                            }
                            us.each(order_object_sort, function(sort) {
                                arr_total1.push(pri_obj(sort));
                                arr_total2.push(order_num_name_object[sort]);
                            })
                            //公司工资项ID和工资项值一一对应
                            var ou_pri_value_obj = us.object(order_object_sort, arr_total1);
                            var ou_name_value_obj = us.object(arr_total2, arr_total1);
                            var ou_pri_name_obj = us.object(order_object_sort, arr_total2)

                            // console.log(company_pri_name_obj);
                            //---------------------同环比数据过滤----------------
                            var ou_pri_value_obj_year, ou_pri_value_obj_month;
                            if (rt_datas_year) {
                                var ft_data_year = us.filter(rt_datas_year, function(temp) {
                                    return String(temp.people.ou) == ou._id
                                })
                                var pri_obj_year = function(pri) {
                                    var obj_val_year = 0;
                                    us.each(ft_data_year, function(f) {
                                        var ft_value_year = us.find(f.items, function(pro) {
                                            return pro.pri.id == String(pri)
                                        })
                                        // console.log(ft_value);
                                        if (ft_value_year) {
                                            return obj_val_year += ft_value_year.amount;
                                        } else {
                                            return obj_val_year = 0;
                                        }
                                    })
                                    return obj_val_year;
                                }
                                var arr_total_year1 = [];
                                // arr_total_year2 = [];
                                us.each(order_object_sort, function(sort_id) {
                                    arr_total_year1.push(pri_obj(sort_id) - pri_obj_year(sort_id));
                                })
                                ou_pri_value_obj_year = us.object(order_object_sort, arr_total_year1)
                            }
                            if (rt_datas_month) {
                                var ft_data_month = us.filter(rt_datas_month, function(temp) {
                                    return String(temp.people.ou) == ou._id
                                })
                                var arr_total_month1 = [];
                                var pri_obj_month = function(pri) {
                                    var obj_val_month = 0;
                                    us.each(ft_data_month, function(f) {
                                        var ft_value_month = us.find(f.items, function(pro) {
                                            return pro.pri.id == String(pri)
                                        })
                                        // console.log(ft_value);
                                        if (ft_value_month) {
                                            return obj_val_month += ft_value_month.amount;
                                        } else {
                                            return obj_val_month = 0;
                                        }
                                    })
                                    return obj_val_month;
                                }
                                us.each(order_object_sort, function(sort_id) {
                                    arr_total_month1.push(pri_obj(sort_id) - pri_obj_month(sort_id));
                                })
                                ou_pri_value_obj_month = us.object(order_object_sort, arr_total_month1)

                            }
                            //取上一年累计实发工资之和
                            var real_pay_wage_count_last_year = 0;
                            // us.each(pp_instancess_last_year, function(last) {
                            var ft_data_last_year = us.filter(pp_instancess_last_year, function(temp) {
                                return String(temp.people.ou) == ou._id
                            })
                            var arr_total_last_year = [];
                            var pri_obj_last_year = function(pri) {
                                var obj_val_last_year = 0;
                                us.each(ft_data_last_year, function(f) {
                                    var ft_value_last_year = us.find(f.items, function(pro) {
                                        return pro.pri.id == String(pri)
                                    })
                                    // console.log(ft_value);
                                    if (ft_value_last_year) {
                                        return obj_val_last_year += ft_value_last_year.amount;
                                    } else {
                                        return obj_val_last_year = 0;
                                    }
                                })
                                return obj_val_last_year;
                            }
                            real_pay_wage_count_last_year += pri_obj_last_year(real_pay_id.id);
                            // })
                            //取当年累计实发工资合计之和
                            var real_pay_wage_count_year = 0;
                            // us.each(pp_instancess_now_year, function(now) {
                            var ft_data_now_year = us.filter(pp_instancess_now_year, function(temp) {
                                return String(temp.people.ou) == ou._id
                            })
                            var arr_total_now_year = [];
                            var pri_obj_now_year = function(pri) {
                                var obj_val_now_year = 0;
                                us.each(ft_data_now_year, function(f) {
                                    var ft_value_now_year = us.find(f.items, function(pro) {
                                        return pro.pri.id == String(pri)
                                    })
                                    // console.log(ft_value);
                                    if (ft_value_now_year) {
                                        // console.log(ft_value_now_year.amount);
                                        return obj_val_now_year += ft_value_now_year.amount;
                                    } else {
                                        return obj_val_now_year = 0;
                                    }
                                })
                                // console.log(obj_val_now_year);
                                return obj_val_now_year;
                            }

                            real_pay_wage_count_year += pri_obj_now_year(real_pay_id.id);
                            // })

                            //--------------------------------人数--人均值 及同环比数据-----------------------//
                            var people_count = ft.length;
                            if (people_count == 0) {
                                var this_month_divide = 0;
                                var last_month_divide = 0;
                                var last_year_divide = 0;
                            } else {
                                var this_month_divide = pri_obj(real_pay_id.id) / people_count;
                                if (pri_obj_month) {
                                    var last_month_divide = pri_obj_month(real_pay_id.id) / people_count;

                                } else {
                                    var last_month_divide = 0;
                                }
                                if (pri_obj_year) {
                                    var last_year_divide = pri_obj_year(real_pay_id.id) / people_count;

                                } else {
                                    var last_year_divide = 0;
                                }

                            }
                            var ou_obj = {};
                            ou_obj.ou_name = ou.ou_name;
                            ou_obj.ou_code = ou.ou_code;
                            ou_obj.ou_id = ou._id;
                            ou_obj.ou_id_value = ou_pri_value_obj;
                            ou_obj.ou_name_value = ou_name_value_obj;
                            ou_obj.ou_id_name = ou_pri_name_obj;
                            // ou_obj.company_id = order_object_sort;
                            if (ou_pri_value_obj_year) {
                                ou_obj.ou_pri_value_obj_year = ou_pri_value_obj_year;
                            } else {
                                ou_obj.ou_pri_value_obj_year = null;
                            }
                            if (ou_pri_value_obj_month) {
                                ou_obj.ou_pri_value_obj_month = ou_pri_value_obj_month;
                            } else {
                                ou_obj.ou_pri_value_obj_month = null;
                            }
                            ou_obj.real_pay_wage_count_year = real_pay_wage_count_year;
                            ou_obj.sequential_total_year = real_pay_wage_count_year - real_pay_wage_count_last_year;
                            ou_obj.people_count = people_count;
                            ou_obj.people_divide = this_month_divide;
                            ou_obj.people_sequential = this_month_divide - last_month_divide;
                            ou_obj.people_sequential_year = this_month_divide - last_year_divide;
                            // console.log(ou_obj);
                            next(null, ou_obj)

                        } else {
                            //-----------------------在计算公式里边得到小计总计项的顺序排列------------------//
                            var result = [];
                            var procedure = [];
                            us.each(procedures, function(temp) {
                                result.push(temp.result);
                                procedure.push(temp.procedure);
                            })
                            //分装结果ID 和 计算步骤
                            var result_procedure = us.object(result, procedure);

                            //取得实发合计项
                            var pay_real_result = us.find(procedures, function(temp) {
                                return temp.procedure.indexOf(temp.result)
                            })
                            var pay_result = us.find(procedures, function(temp) {
                                return temp.result.pri_category == '3'
                            })
                            //the step array of pay_real_result
                            //the operand_id of pay_real_result
                            var operand_id_real_result = [];
                            //the sign of pa_real_result
                            var total_array = []; //存放键值对的总数组
                            var step_real_result = [];
                            var operand_id_name_result = [];
                            //得到小计项的步骤和ID(operand)
                            us.each(pay_real_result.procedure, function(temp) {
                                step_real_result.push(temp.step);
                                operand_id_real_result.push(temp.operand.id);
                                operand_id_name_result.push(temp.operand.pri_name);
                                // sign_real_result.push(temp.sign);
                            })
                            //  取结果项的步骤
                            var result_step = us.last(step_real_result) + 1;
                            step_real_result.push(result_step);
                            //小计和合计项的ID&名称
                            operand_id_real_result.push(pay_result.result.id);
                            operand_id_name_result.push(pay_result.result.pri_name);
                            var order_id_name_object = us.object(operand_id_real_result, operand_id_name_result)
                            //将步骤和id 组装成对象
                            var step_id = us.object(step_real_result, operand_id_real_result);
                            var sort_object = us.sortBy(step_id, function(temp) {
                                return step_real_result
                            })
                            //------------------------------------------------------------//            
                            var arr_total_pro1 = [],
                                arr_total_pro2 = [];
                            var pri_obj_procedure = function(pri) {
                                var obj_val = 0;
                                us.each(ft, function(f) {
                                    var ft_value = us.find(f.items, function(pro) {
                                        return pro.pri.id == String(pri)
                                    })
                                    // console.log(ft_value);
                                    if (ft_value) {
                                        return obj_val += ft_value.amount;
                                    } else {
                                        return obj_val = 0;
                                    }
                                })
                                return obj_val;
                            }
                            us.each(sort_object, function(sort) {
                                arr_total_pro1.push(pri_obj_procedure(sort));
                                arr_total_pro2.push(order_id_name_object[sort]);
                            })
                            var ou_pri_value_obj = us.object(sort_object, arr_total_pro1);
                            var ou_name_value_obj = us.object(arr_total_pro2, arr_total_pro1);
                            var ou_pri_name_obj = us.object(sort_object, arr_total_pro2)
                            //---------------------同环比数据过滤----------------
                            var ou_pri_value_obj_year, ou_pri_value_obj_month;
                            if (rt_datas_year) {
                                var ft_data_year = us.filter(rt_datas_year, function(temp) {
                                    return String(temp.people.ou) == ou._id
                                })
                                var pri_obj_year = function(pri) {
                                    var obj_val_year = 0;
                                    us.each(ft_data_year, function(f) {
                                        var ft_value_year = us.find(f.items, function(pro) {
                                            return pro.pri.id == String(pri)
                                        })
                                        // console.log(ft_value);
                                        if (ft_value_year) {
                                            return obj_val_year += ft_value_year.amount;
                                        } else {
                                            return obj_val_year = 0;
                                        }
                                    })
                                    return obj_val_year;
                                }
                                var arr_total_year1 = [];
                                // arr_total_year2 = [];
                                us.each(sort_object, function(sort) {
                                    arr_total_year1.push(pri_obj_procedure(sort) - pri_obj_year(sort));
                                })
                                ou_pri_value_obj_year = us.object(sort_object, arr_total_year1)
                            }
                            if (rt_datas_month) {
                                var ft_data_month = us.filter(rt_datas_month, function(temp) {
                                    return String(temp.people.ou) == ou._id
                                })
                                var arr_total_month1 = [];
                                var pri_obj_month = function(pri) {
                                    var obj_val_month = 0;
                                    us.each(ft_data_month, function(f) {
                                        var ft_value_month = us.find(f.items, function(pro) {
                                            return pro.pri.id == String(pri)
                                        })
                                        // console.log(ft_value);
                                        if (ft_value_month) {
                                            return obj_val_month += ft_value_month.amount;
                                        } else {
                                            return obj_val_month = 0;
                                        }
                                    })
                                    return obj_val_month;
                                }
                                us.each(sort_object, function(sort) {
                                    arr_total_month1.push(pri_obj_procedure(sort) - pri_obj_month(sort));
                                })
                                ou_pri_value_obj_month = us.object(sort_object, arr_total_month1)

                            }
                            //取上一年累计实发工资之和
                            var real_pay_wage_count_last_year = 0;
                            // us.each(pp_instancess_last_year, function(last) {
                            var ft_data_last_year = us.filter(pp_instancess_last_year, function(temp) {
                                return String(temp.people.ou) == ou._id
                            })
                            var arr_total_last_year = [];
                            var pri_obj_last_year = function(pri) {
                                var obj_val_last_year = 0;
                                us.each(ft_data_last_year, function(f) {
                                    var ft_value_last_year = us.find(f.items, function(pro) {
                                        return pro.pri.id == String(pri)
                                    })
                                    // console.log(ft_value);
                                    if (ft_value_last_year) {
                                        return obj_val_last_year += ft_value_last_year.amount;
                                    } else {
                                        return obj_val_last_year = 0;
                                    }
                                })
                                return obj_val_last_year;
                            }
                            real_pay_wage_count_last_year += pri_obj_last_year(pay_result.result.id);
                            // })
                            //取当年累计实发工资合计之和
                            var real_pay_wage_count_year = 0;
                            // us.each(pp_instancess_now_year, function(now) {
                            var ft_data_now_year = us.filter(pp_instancess_now_year, function(temp) {
                                return String(temp.people.ou) == ou._id
                            })
                            var arr_total_now_year = [];
                            var pri_obj_now_year = function(pri) {
                                var obj_val_now_year = 0;
                                us.each(ft_data_now_year, function(f) {
                                    var ft_value_now_year = us.find(f.items, function(pro) {
                                        return pro.pri.id == String(pri)
                                    })
                                    // console.log(ft_value);
                                    if (ft_value_now_year) {
                                        return obj_val_now_year += ft_value_now_year.amount;
                                    } else {
                                        return obj_val_now_year = 0;
                                    }
                                })
                                return obj_val_now_year;
                            }
                            real_pay_wage_count_year += pri_obj_now_year(pay_result.result.id);
                            // })
                            var people_count = ft.length;
                            if (people_count == 0) {
                                var this_month_divide = 0;
                                var last_month_divide = 0;
                                var last_year_divide = 0;
                            } else {
                                var this_month_divide = pri_obj_procedure(pay_result.result.id) / people_count;
                                if (pri_obj_month) {
                                    var last_month_divide = pri_obj_month(pay_result.result.id) / people_count;

                                } else {
                                    var last_month_divide = 0;
                                }
                                if (last_year_divide) {
                                    var last_year_divide = pri_obj_year(pay_result.result.id) / people_count;

                                } else {
                                    var last_year_divide = 0;
                                }

                            }
                            var ou_obj = {};
                            ou_obj.ou_name = ou.ou_name;
                            ou_obj.ou_code = ou.ou_code;
                            ou_obj.ou_id = ou._id;
                            ou_obj.ou_id_value = ou_pri_value_obj;
                            ou_obj.ou_name_value = ou_name_value_obj;
                            ou_obj.ou_id_name = ou_pri_name_obj;
                            // ou_obj.ou_id = sort_object;
                            if (ou_pri_value_obj_year) {
                                ou_obj.ou_pri_value_obj_year = ou_pri_value_obj_year;
                            } else {
                                ou_obj.ou_pri_value_obj_year = null;
                            }
                            if (ou_pri_value_obj_month) {
                                ou_obj.ou_pri_value_obj_month = ou_pri_value_obj_month;
                            } else {
                                ou_obj.company_pri_value_obj_month = null;
                            }
                            ou_obj.real_pay_wage_count_year = real_pay_wage_count_year;
                            ou_obj.sequential_total_year = real_pay_wage_count_year - real_pay_wage_count_last_year;
                            ou_obj.people_count = people_count;
                            ou_obj.people_divide = this_month_divide;
                            ou_obj.people_sequential = this_month_divide - last_month_divide;
                            ou_obj.people_sequential_year = this_month_divide - last_year_divide;
                            // console.log(ou_obj);
                            next(null, ou_obj)
                        }
                    }, cb)


                }
            ], cb)

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
                pareports: result
            })
        }
    })
}
var rt_002__people_list = function(req, res) {
    var client = req.user.client.id;
    // var company = req.body.company;
    var ou_id = req.body.ou_id;
    var period = req.body.period;
    async.waterfall([

        function(cb) {
            async.parallel({
                pay_pps: function(cb) {
                    PayrollPeopleInstance.find({
                        client: client
                    }).populate('people items.pri').exec(cb);
                },
                order: function(cb) {
                    ReportOrderConfig.findOne({
                        client: client
                    }).populate('payrolls_order').exec(cb)
                },
                procedures: function(cb) {
                    PayrollProcedure.find({
                        client: client
                    }).populate('result procedure.operand').exec(cb)
                }

            }, cb)
        },
        function(ppitss, cb) {
            var ppits = ppitss.pay_pps;
            var order_pris = ppitss.order.payrolls_order;
            var procedures = ppitss.procedures;
            var pp_instances = us.filter(ppits, function(ppit) {
                return String(ppit.people.ou) == ou_id
            })

            var people_objs = us.filter(ppits, function(ppit) {
                return String(ppit.people.ou) == ou_id && moment(ppit.pay_start).format("YYYYMM") == period;
            })
            //月份同比数据 
            var pp_instancess_year = us.filter(pp_instances, function(obj) {
                return moment(obj.pay_start).add('year', 1).format("YYYYMM") == period;
            })
            //月份环比数据
            var pp_instancess_month = us.filter(pp_instances, function(obj) {
                return moment(obj.pay_start).add('month', 1).format("YYYYMM") == period;
            })
            //取今年整年的数据
            var pp_instancess_now_year = us.filter(pp_instances, function(obj) {
                return moment(obj.pay_start).format("YYYY") == period.substring(-1, 4);
            })
            //取上一年的数据
            var pp_instancess_last_year = us.filter(pp_instances, function(obj) {
                return moment(obj.pay_start).add('year', 1).format("YYYY") == period.substring(-1, 4);
            })
            async.times(people_objs.length, function(n, next) {
                var ou_obj = {};
                var rt_datas_month, rt_datas_year;
                if (pp_instancess_year.length > 0 && pp_instancess_year != undefined) {
                    rt_datas_year = pp_instancess_year;
                    ou_obj.sequential_year = true;
                } else {
                    ou_obj.sequential_year = null;
                };
                if (pp_instancess_month.length > 0 && pp_instancess_month != undefined) {
                    rt_datas_month = pp_instancess_month;
                    ou_obj.sequential_month = true;
                } else {
                    ou_obj.sequential_month = null;
                }
                var ft = people_objs[n];
                if (order_pris.length > 0) {
                    var order_num = [];
                    var order_pri = [];
                    var order_pri_name = [];
                    //取实发工资ID
                    var order_priss = us.filter(order_pris, function(temp) {
                        return temp.pri_category != '1'
                    })
                    var real_pay_id = us.find(order_priss, function(temp) {
                        return temp.pri_category == '3'
                    })
                    //取序号和工资项ID
                    us.each(order_priss, function(order) {
                        order_num.push(order_priss.indexOf(order));
                        order_pri.push(order.id);
                        order_pri_name.push(order.pri_name)
                    })
                    var order_object = us.object(order_num, order_pri);
                    var order_num_name_object = us.object(order_pri, order_pri_name);
                    var order_object_sort = us.sortBy(order_object, function(s) {
                        return s.order_num
                    })
                    var arr_total1 = [],
                        arr_total2 = [];
                    var pri_obj = function(pri) {
                        var obj_val = 0;
                        // us.each(ft, function(f) {
                        var ft_value = us.find(ft.items, function(pro) {
                            return pro.pri.id == String(pri)
                        })
                        // console.log(ft_value);
                        if (ft_value) {
                            return obj_val += ft_value.amount;
                        } else {
                            return obj_val = 0;
                        }
                        // })
                        return obj_val;
                    }
                    us.each(order_object_sort, function(sort) {
                        arr_total1.push(pri_obj(sort));
                        arr_total2.push(order_num_name_object[sort]);
                    })
                    //公司工资项ID和工资项值一一对应
                    var ou_pri_value_obj = us.object(order_object_sort, arr_total1);
                    var ou_name_value_obj = us.object(arr_total2, arr_total1);
                    var ou_pri_name_obj = us.object(order_object_sort, arr_total2)

                    // console.log(company_pri_name_obj);
                    //---------------------同环比数据过滤----------------
                    var ou_pri_value_obj_year, ou_pri_value_obj_month;
                    if (rt_datas_year) {
                        var ft_data_year = us.filter(rt_datas_year, function(temp) {
                            return String(temp.people.id) == ft.people._id
                        })
                        // console.log(ft_data_year.length);
                        var pri_obj_year = function(pri) {
                            var obj_val_year = 0;
                            us.each(ft_data_year, function(f) {
                                var ft_value_year = us.find(f.items, function(pro) {
                                    return pro.pri.id == String(pri)
                                })
                                // console.log(ft_value);
                                if (ft_value_year) {
                                    return obj_val_year += ft_value_year.amount;
                                } else {
                                    return obj_val_year = 0;
                                }
                            })
                            return obj_val_year;
                        }
                        var arr_total_year1 = [];
                        // arr_total_year2 = [];
                        us.each(order_object_sort, function(sort_id) {
                            arr_total_year1.push(pri_obj(sort_id) - pri_obj_year(sort_id));
                        })
                        ou_pri_value_obj_year = us.object(order_object_sort, arr_total_year1)
                    }
                    if (rt_datas_month) {
                        var ft_data_month = us.filter(rt_datas_month, function(temp) {
                            return String(temp.people.id) == ft.people._id
                        })
                        var arr_total_month1 = [];
                        var pri_obj_month = function(pri) {
                            var obj_val_month = 0;
                            us.each(ft_data_month, function(f) {
                                var ft_value_month = us.find(f.items, function(pro) {
                                    return pro.pri.id == String(pri)
                                })
                                // console.log(ft_value);
                                if (ft_value_month) {
                                    return obj_val_month += ft_value_month.amount;
                                } else {
                                    return obj_val_month = 0;
                                }
                            })
                            return obj_val_month;
                        }
                        us.each(order_object_sort, function(sort_id) {
                            arr_total_month1.push(pri_obj(sort_id) - pri_obj_month(sort_id));
                        })
                        ou_pri_value_obj_month = us.object(order_object_sort, arr_total_month1)

                    }
                    //取上一年累计实发工资之和
                    var real_pay_wage_count_last_year = 0;
                    var pp_last_year = us.filter(pp_instancess_last_year, function(pp) {
                        return String(pp.people.id) == ft.people.id
                    })
                    if (pp_last_year.length > 0 && pp_last_year != undefined) {
                        var pri_obj_last_year;
                        us.each(pp_last_year, function(last) {

                            var arr_total_last_year = [];
                            pri_obj_last_year = function(pri) {
                                var obj_val_last_year = 0;
                                // us.each(last, function(f) {
                                var ft_value_last_year = us.find(last.items, function(pro) {
                                    return pro.pri.id == String(pri)
                                })
                                if (ft_value_last_year) {
                                    return obj_val_last_year += ft_value_last_year.amount;
                                } else {
                                    return obj_val_last_year = 0;
                                }
                                // })
                                return obj_val_last_year;
                            }

                        })
                        real_pay_wage_count_last_year += pri_obj_last_year(real_pay_id.id);
                    }
                    //取当年累计实发工资合计之和
                    var real_pay_wage_count_year = 0;
                    var pri_obj_now_year;
                    var pp_now_year = us.filter(pp_instancess_now_year, function(now_year) {
                        return String(now_year.people.id) == ft.people.id
                    })
                    if (pp_now_year.length > 0 && pp_now_year != undefined) {
                        us.each(pp_now_year, function(now) {
                            var arr_total_now_year = [];
                            pri_obj_now_year = function(pri) {
                                var obj_val_now_year = 0;
                                // us.each(now, function(f) {
                                var ft_value_now_year = us.find(now.items, function(pro) {
                                    return pro.pri.id == String(pri)
                                })
                                if (ft_value_now_year) {
                                    return obj_val_now_year += ft_value_now_year.amount;
                                } else {
                                    return obj_val_now_year = 0;
                                }
                                // })
                                return obj_val_now_year;
                            }

                        })
                        real_pay_wage_count_year += pri_obj_now_year(real_pay_id.id);
                    }
                    //--------------------------------人数--人均值 及同环比数据-----------------------//
                    var people_count = ft.length;
                    if (people_count == 0) {
                        var this_month_divide = 0;
                        var last_month_divide = 0;
                        var last_year_divide = 0;
                    } else {
                        var this_month_divide = pri_obj(real_pay_id.id) / people_count;
                        if (pri_obj_month) {
                            var last_month_divide = pri_obj_month(real_pay_id.id) / people_count;

                        } else {
                            var last_month_divide = 0;
                        }
                        if (pri_obj_year) {
                            var last_year_divide = pri_obj_year(real_pay_id.id) / people_count;

                        } else {
                            var last_year_divide = 0;
                        }

                    }
                    var ou_obj = {};
                    ou_obj.pp_name = ft.people.firstname + ft.people.lastname;
                    ou_obj.pp_no = ft.people.people_no;
                    ou_obj.pp_id = ft.people._id;
                    ou_obj.pp_position = ft.people.position_name;
                    ou_obj.ou_id_value = ou_pri_value_obj;
                    ou_obj.ou_name_value = ou_name_value_obj;
                    ou_obj.ou_id_name = ou_pri_name_obj;
                    // ou_obj.company_id = order_object_sort;
                    if (ou_pri_value_obj_year) {
                        ou_obj.ou_pri_value_obj_year = ou_pri_value_obj_year;
                    } else {
                        ou_obj.ou_pri_value_obj_year = null;
                    }
                    if (ou_pri_value_obj_month) {
                        ou_obj.ou_pri_value_obj_month = ou_pri_value_obj_month;
                    } else {
                        ou_obj.ou_pri_value_obj_month = null;
                    }
                    ou_obj.real_pay_wage_count_year = real_pay_wage_count_year;
                    ou_obj.sequential_total_year = real_pay_wage_count_year - real_pay_wage_count_last_year;
                    ou_obj.people_count = people_count;
                    ou_obj.people_divide = this_month_divide;
                    ou_obj.people_sequential = this_month_divide - last_month_divide;
                    ou_obj.people_sequential_year = this_month_divide - last_year_divide;
                    // console.log(ou_obj);
                    next(null, ou_obj)

                } else {
                    //-----------------------在计算公式里边得到小计总计项的顺序排列------------------//
                    var result = [];
                    var procedure = [];
                    us.each(procedures, function(temp) {
                        result.push(temp.result);
                        procedure.push(temp.procedure);
                    })
                    //分装结果ID 和 计算步骤
                    var result_procedure = us.object(result, procedure);

                    //取得实发合计项
                    var pay_real_result = us.find(procedures, function(temp) {
                        return temp.procedure.indexOf(temp.result)
                    })
                    var pay_result = us.find(procedures, function(temp) {
                        return temp.result.pri_category == '3'
                    })
                    //the step array of pay_real_result
                    //the operand_id of pay_real_result
                    var operand_id_real_result = [];
                    //the sign of pa_real_result
                    var total_array = []; //存放键值对的总数组
                    var step_real_result = [];
                    var operand_id_name_result = [];
                    //得到小计项的步骤和ID(operand)
                    us.each(pay_real_result.procedure, function(temp) {
                        step_real_result.push(temp.step);
                        operand_id_real_result.push(temp.operand.id);
                        operand_id_name_result.push(temp.operand.pri_name);
                        // sign_real_result.push(temp.sign);
                    })
                    //  取结果项的步骤
                    var result_step = us.last(step_real_result) + 1;
                    step_real_result.push(result_step);
                    //小计和合计项的ID&名称
                    operand_id_real_result.push(pay_result.result.id);
                    operand_id_name_result.push(pay_result.result.pri_name);
                    var order_id_name_object = us.object(operand_id_real_result, operand_id_name_result)
                    //将步骤和id 组装成对象
                    var step_id = us.object(step_real_result, operand_id_real_result);
                    var sort_object = us.sortBy(step_id, function(temp) {
                        return step_real_result
                    })
                    //------------------------------------------------------------//            
                    var arr_total_pro1 = [],
                        arr_total_pro2 = [];
                    var pri_obj_procedure = function(pri) {
                        var obj_val = 0;
                        // console.log(ft);
                        // us.each(ft, function(f) {
                        var ft_value = us.find(ft.items, function(pro) {
                            return pro.pri.id == String(pri)
                        })
                        // console.log(ft_value);
                        if (ft_value) {
                            return obj_val += ft_value.amount;
                        } else {
                            return obj_val = 0;
                        }
                        // })
                        return obj_val;
                    }
                    us.each(sort_object, function(sort) {
                        arr_total_pro1.push(pri_obj_procedure(sort));
                        arr_total_pro2.push(order_id_name_object[sort]);
                    })
                    var ou_pri_value_obj = us.object(sort_object, arr_total_pro1);
                    var ou_name_value_obj = us.object(arr_total_pro2, arr_total_pro1);
                    var ou_pri_name_obj = us.object(sort_object, arr_total_pro2)
                    //---------------------同环比数据过滤----------------
                    var ou_pri_value_obj_year, ou_pri_value_obj_month;
                    if (rt_datas_year) {
                        // var ft_data_year = us.filter(rt_datas_year, function(temp) {
                        //     return String(temp.people.ou) == ou._id
                        // })
                        var pri_obj_year = function(pri) {
                            var obj_val_year = 0;
                            us.each(rt_datas_year, function(f) {
                                var ft_value_year = us.find(f.items, function(pro) {
                                    return pro.pri.id == String(pri)
                                })
                                // console.log(ft_value);
                                if (ft_value_year) {
                                    return obj_val_year += ft_value_year.amount;
                                } else {
                                    return obj_val_year = 0;
                                }
                            })
                            return obj_val_year;
                        }
                        var arr_total_year1 = [];
                        // arr_total_year2 = [];
                        us.each(sort_object, function(sort) {
                            arr_total_year1.push(pri_obj_procedure(sort) - pri_obj_year(sort));
                        })
                        ou_pri_value_obj_year = us.object(sort_object, arr_total_year1)
                    }
                    if (rt_datas_month) {
                        // var ft_data_month = us.filter(rt_datas_month, function(temp) {
                        //     return String(temp.people.ou) == ou._id
                        // })
                        var arr_total_month1 = [];
                        var pri_obj_month = function(pri) {
                            var obj_val_month = 0;
                            us.each(rt_datas_month, function(f) {
                                var ft_value_month = us.find(f.items, function(pro) {
                                    return pro.pri.id == String(pri)
                                })
                                // console.log(ft_value);
                                if (ft_value_month) {
                                    return obj_val_month += ft_value_month.amount;
                                } else {
                                    return obj_val_month = 0;
                                }
                            })
                            return obj_val_month;
                        }
                        us.each(sort_object, function(sort) {
                            arr_total_month1.push(pri_obj_procedure(sort) - pri_obj_month(sort));
                        })
                        ou_pri_value_obj_month = us.object(sort_object, arr_total_month1)

                    }
                    //取上一年累计实发工资之和
                    var real_pay_wage_count_last_year = 0;
                    if (pp_instancess_last_year.length > 0) {
                        us.each(pp_instancess_last_year, function(last) {
                            // var ft_data_last_year = us.filter(last.data, function(temp) {
                            //     return String(temp.people.ou) == ou._id
                            // })
                            var arr_total_last_year = [];
                            var pri_obj_last_year = function(pri) {
                                var obj_val_last_year = 0;
                                // console.log(last);
                                // us.each(last, function(f) {
                                var ft_value_last_year = us.find(last.items, function(pro) {
                                    return pro.pri.id == String(pri)
                                })
                                // console.log(ft_value_last_year);
                                if (ft_value_last_year) {
                                    return obj_val_last_year += ft_value_last_year.amount;
                                } else {
                                    return obj_val_last_year = 0;
                                }
                                // })
                                return obj_val_last_year;
                            }
                            real_pay_wage_count_last_year += pri_obj_last_year(pay_result.result.id);
                        })
                    }
                    //取当年累计实发工资合计之和
                    var real_pay_wage_count_year = 0;
                    if (pp_instancess_now_year.length > 0) {
                        us.each(pp_instancess_now_year, function(now) {
                            // var ft_data_now_year = us.filter(now.data, function(temp) {
                            //     return String(temp.people.ou) == ou._id
                            // })
                            var arr_total_now_year = [];
                            var pri_obj_now_year = function(pri) {
                                var obj_val_now_year = 0;
                                // us.each(now, function(f) {
                                var ft_value_now_year = us.find(now.items, function(pro) {
                                    return pro.pri.id == String(pri)
                                })
                                // console.log(ft_value);
                                if (ft_value_now_year) {
                                    return obj_val_now_year += ft_value_now_year.amount;
                                } else {
                                    return obj_val_now_year = 0;
                                }
                                // })
                                return obj_val_now_year;
                            }
                            real_pay_wage_count_year += pri_obj_now_year(pay_result.result.id);
                        })
                    }
                    var people_count = people_objs.length;
                    if (people_count == 0) {
                        var this_month_divide = 0;
                        var last_month_divide = 0;
                        var last_year_divide = 0;
                    } else {
                        var this_month_divide = pri_obj_procedure(pay_result.result.id) / people_count;
                        if (pri_obj_month) {
                            var last_month_divide = pri_obj_month(pay_result.result.id) / people_count;

                        } else {
                            var last_month_divide = 0;
                        }
                        if (last_year_divide) {
                            var last_year_divide = pri_obj_year(pay_result.result.id) / people_count;

                        } else {
                            var last_year_divide = 0;
                        }

                    }
                    var pp_obj = {};
                    // ou_obj.ou_name = ou.ou_name;
                    // ou_obj.ou_code = ou.ou_code;
                    // ou_obj.ou_id = ou._id;
                    ou_obj.pp_name = ft.people.firstname + ft.people.lastname;
                    ou_obj.pp_no = ft.people.people_no;
                    ou_obj.pp_id = ft.people._id;
                    ou_obj.pp_position = ft.people.position_name;
                    ou_obj.ou_id_value = ou_pri_value_obj;
                    ou_obj.ou_name_value = ou_name_value_obj;
                    ou_obj.ou_id_name = ou_pri_name_obj;
                    // ou_obj.ou_id = sort_object;
                    if (ou_pri_value_obj_year) {
                        ou_obj.ou_pri_value_obj_year = ou_pri_value_obj_year;
                    } else {
                        ou_obj.ou_pri_value_obj_year = null;
                    }
                    if (ou_pri_value_obj_month) {
                        ou_obj.ou_pri_value_obj_month = ou_pri_value_obj_month;
                    } else {
                        ou_obj.company_pri_value_obj_month = null;
                    }
                    ou_obj.real_pay_wage_count_year = real_pay_wage_count_year;
                    ou_obj.sequential_total_year = real_pay_wage_count_year - real_pay_wage_count_last_year;
                    ou_obj.people_count = people_count;
                    ou_obj.people_divide = this_month_divide;
                    ou_obj.people_sequential = this_month_divide - last_month_divide;
                    ou_obj.people_sequential_year = this_month_divide - last_year_divide;
                    next(null, ou_obj)
                }
            }, cb)
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
                result: result,
            })
        }
    })

}



module.exports = function(app, checkAuth) {
    var __base_path = '/admin/py/payroll_company_report';
    app.get(__base_path + '/rt_002_list', checkAuth, rt_002_list);
    // app.get(__base_path + '/rt_002_list', checkAuth, rt_002_list);
    app.post(__base_path + '/rt_002_search', checkAuth, rt_002_search);
    app.post(__base_path + '/rt_002_ou_search', checkAuth, rt_002_ou_search);
    app.post(__base_path + '/rt_002__people_list', checkAuth, rt_002__people_list);

}
