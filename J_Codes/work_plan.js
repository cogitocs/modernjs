var sprintf = require('sprintf').sprintf;
var People = require('../../models/people').People;
var async = require('async');
var TmWorkPlan = require('../../models/tm').TmWorkPlan;
var moment = require('moment');
var NumberRange = require('../../models/ddic').NumberRange;
var WorkTime = require('../../models/tm').WorkTime;
var WorkCategory = require('../../models/tm').WorkCategory;
var PeopleWorkCalendar = require('../../models/tm').PeopleWorkCalendar;

var work_plan_bb_form = function(req, res) {
    var i18n = req.i18n;
    var client = req.user.client.id;
    var render_data = {
        title: '工作计划',
        user: req.user,
    };

    res.render('admin/tm/workplan/list', render_data);
}

var work_plan_bb_list = function(req, res) {
    var i18n = req.i18n;
    var client = req.user.client.id;

    TmWorkPlan.find({
        client: client
    }, function(err, sccs) {
        if (err) {
            return res.json({
                code: 'ERR',
                msg: '内部服务器错误：' + err
            });
        } else {
            return res.json(sccs);
        };
    })
}

var work_plan_bb_fetch = function(req, res) {
    var i18n = req.i18n;
    var client = req.user.client.id;
    var sc_id = req.params.sc_id;

    TmWorkPlan.findById(sc_id, function(err, scc) {
        if (err) {
            return res.json({
                code: 'ERR',
                msg: '内部服务器错误：' + err
            });
        } else {
            return res.json(scc);
        };
    });
}

var work_plan_bb_create = function(req, res) {
    var i18n = req.i18n;
    var client = req.user.client.id;
    var sc_id = req.params.sc_id;

    var data4create = {
        client: client,
        plan_name: req.body.plan_name,
        description: req.body.description || '',
        work_time: req.body.work_time || null,
        work_calendar: req.body.work_calendar || null,
        expire_on: req.body.expire_on || '',
        expire_off: req.body.expire_off || ''
    };
    async.waterfall([

        function(cb) {
            //判断系统配置中的是自动给号还是手工给号
            if (req.user.client.config.work_plan_code.src == 'SYSTEM') { //系统自动给号
                NumberRange.getNextNumber(req.user.client.id, req.user.client.config.work_plan_code.nr_obj, function(plan_code) {
                    if (plan_code) {
                        cb(null, plan_code);
                    } else {
                        cb(new Error('获取号码失败'), null);
                    };
                })

            } else { //手工给号
                cb(null, req.body.plan_code)
            };
        },
        function(plan_code, cb) {
            data4create.plan_code = plan_code;
            TmWorkPlan.create(data4create, function(err, result) {
                cb(null, result)
            });
        },
    ], function(err, result) {
        if (err) {
            return res.status(500).json({
                code: 'ERR',
                msg: '内部服务器错误：' + err
            });
        };
        if (result) {
            return res.json({
                code: 'OK',
                msg: sprintf('工作计划 <strong>%s</strong> 保存成功！', result.plan_name),
                _id: result._id,
            });
        } else {
            return res.status(500).json({
                code: 'ERR',
                msg: '工作计划保存失败'
            });
        };
    })
}

var work_plan_bb_update = function(req, res) {
    var i18n = req.i18n;
    var client = req.user.client.id;
    var sc_id = req.params.sc_id;

    var data4update = {
        client: client,
        plan_name: req.body.plan_name,
        plan_code: req.body.plan_code,
        description: req.body.description || '',
        work_time: req.body.work_time,
        work_calendar: req.body.work_calendar,
        expire_on: req.body.expire_on,
        expire_off: req.body.expire_off,
        calendar_data: req.body.calendar_data || null
    };
    TmWorkPlan.findByIdAndUpdate(sc_id, data4update, function(err, scc) {
        if (err) {
            return res.status(500).json({
                code: 'ERR',
                msg: '内部服务器错误：' + err
            });
        };
        if (scc) {
            return res.json({
                code: 'OK',
                msg: sprintf('工作计划 <strong>%s</strong> 保存成功！', scc.plan_name),
                _id: scc._id,
            });
        } else {
            return res.status(500).json({
                code: 'ERR',
                msg: '工作计划保存失败'
            });
        };
    });
}
var work_plan_bb_delete = function(req, res) {
    var i18n = req.i18n;
    var client = req.user.client.id;
    var sc_id = req.params.sc_id;

    TmWorkPlan.findByIdAndRemove(sc_id, function(err, scc) {
        if (err) {
            return res.status(500).json({
                code: 'ERR',
                msg: '内部服务器错误：' + err
            });
        };
        if (scc) {
            return res.json({
                code: 'OK',
                msg: sprintf('工作计划 <strong>%s</strong> 删除成功！', scc.plan_name),
                _id: scc._id,
            });
        } else {
            return res.status(500).json({
                code: 'ERR',
                msg: '工作计划删除失败'
            });
        };
    });
}
var work_plan_typeahead = function(req, res) {
    var client = req.user.client.id;
    var i18n = req.i18n;
    TmWorkPlan.find({
        client: client,
    }, function(err, workplan) {
        if (err) {
            res.json({
                code: 'ERR',
                msg: '内部服务器错误：' + err
            });
        };
        var ret = [];
        for (var i = 0; i < workplan.length; i++) {
            ret.push({
                id: workplan[i].id,
                code: workplan[i].plan_code,
                name: workplan[i].plan_name,
            });
        };
        res.json(ret);
    })
}

var work_plan_inputhelp = function(req, res) {
    var client = req.user.client.id;
    var i18n = req.i18n;
    TmWorkPlan.find({
        client: client,
    }, function(err, workplan) {
        if (err) {
            res.json({
                code: 'ERR',
                msg: '内部服务器错误：' + err
            });
        };
        res.render('admin/tm/workplan/input_help', {
            workplan: workplan
        });
    })
}
var work_plan_bb_edit = function(req, res) {
    var client = req.user.client.id;
    var up_id = req.query.up_id;
    var render_data = {
        title: '工作计划-编辑',
        user: req.user,
        _: us,
        moment: moment
    };
    TmWorkPlan.findById(up_id).populate('work_time work_calendar.calendar').exec(function(err, result) {
        if (err) {
            return res.json({
                code: 'ERR',
                msg: '内部服务器错误'
            })
        }
        if (result) {
            render_data.data = result;
            var calendar = _.map(result.work_calendar, function(temp) {
                return String(temp.which_calendar)
            });
            var calendar_all = _.find(result.work_calendar, function(temp) {
                return temp.which_calendar == 'A'
            })
            var calendar_even = _.find(result.work_calendar, function(temp) {
                return temp.which_calendar == 'E'
            })
            var calendar_odd = _.find(result.work_calendar, function(temp) {
                return temp.which_calendar == 'O'
            })
            render_data.calendar_all = calendar_all ? calendar_all : '';
            render_data.calendar_even = calendar_even ? calendar_even : '';
            render_data.calendar_odd = calendar_odd ? calendar_odd : '';

            render_data.calendar = calendar;
            res.render('admin/tm/workplan/form', render_data);
        }
    })
}
var work_plan_bb_save = function(req, res) {
    var i18n = req.i18n;
    var client = req.user.client.id;
    var up_id = req.body.up_id;
    var updatedata = {
        client: client,
        plan_name: req.body.plan_name,
        plan_code: req.body.plan_code,
        work_time_name: req.body.work_time_name || '',
        description: req.body.description || '',
        work_time: req.body.work_time || null,
        work_calendar: JSON.parse(req.body.item) || null,
        expire_on: req.body.expire_on,
        expire_off: req.body.expire_off
    };
    TmWorkPlan.findByIdAndUpdate(up_id, updatedata, function(err, result) {
        if (err) {
            return res.status(500).json({
                code: 'ERR',
                msg: '内部服务器错误：' + err
            });
        };
        if (result) {
            return res.json({
                code: 'OK',
                msg: sprintf('工作时间保存成功！'),
                _id: result._id,
            });
        } else {
            return res.status(500).json({
                code: 'ERR',
                msg: '工作时间保存失败'
            });
        };
    })
};
var work_plan_get_data = function(req, res) {
        var client = req.user.client.id;
        People.find({
            client: client,
            block: false
        }).populate('tm_work_plan').select('id people_no tm_work_plan').exec(function(err, result) {
            if (err) {
                return res.json({
                    code: 'ERR',
                    msg: '内部服务器错误'
                })
            };
            if (result) {
                return res.json({
                    code: 'OK',
                    data: result
                })
            }
        })
    }
    //工作日历
var work_plan_calendar = function(req, res) {
        var i18n = req.i18n;
        var client = req.user.client.id;
        var plan_id = req.query.plan_id;
        var render_data = {
            title: '工作日历-视图',
            user: req.user,
        };
        async.parallel({
            plan: function(cb) {
                //生成工作日历表
                TmWorkPlan.findById(plan_id).populate('work_calendar.calendar').exec(function(err, result) {
                    //工作日历
                    var expire_on = result.expire_on;
                    var expire_off = result.expire_off;
                    //时间区间中的时间
                    var days_between = moment(expire_off).diff(moment(expire_on), 'days');
                    var days_arr_even = [],
                        days_arr_odd = [],
                        days_arr = [];
                    for (var i = 0; i <= days_between; i++) {
                        var iterate_date = moment(expire_on).add('days', i);
                        var num = moment(iterate_date).weeks();
                        if (num % 2) {
                            days_arr_even.push(iterate_date);
                        } else {
                            days_arr_odd.push(iterate_date);
                        };
                        days_arr.push(iterate_date);
                    };
                    //取出该人员当前工作计划内的正常上班日期
                    if (result.work_calendar.length == 1 && result.work_calendar[0].which_calendar == 'A') {
                        var cycle_period = _.map(result.work_calendar[0].calendar.cycle_period, function(week) {
                            return String(week.weekday);
                        });
                        var work_calendar_all = _.filter(days_arr, function(date) {
                            return !!~cycle_period.indexOf(String(moment(date).days()))
                        });
                    } else {
                        if (result.work_calendar.length == 2) {
                            var work_calendar_odd, work_calendar_even;
                            _.each(result.work_calendar, function(temp) {
                                if (temp.which_calendar == 'O') {
                                    var cycle_period_odd = _.map(temp.calendar.cycle_period, function(week) {
                                        return String(week.weekday);
                                    });

                                    work_calendar_odd = _.filter(days_arr_odd, function(date) {
                                        return !!~cycle_period_odd.indexOf(String(moment(date).days()))
                                    });
                                } else if (temp.which_calendar == 'E') {
                                    var cycle_period_even = _.map(temp.calendar.cycle_period, function(week) {
                                        return String(week.weekday);
                                    });

                                    work_calendar_even = _.filter(days_arr_even, function(date) {
                                        return !!~cycle_period_even.indexOf(String(moment(date).days()))
                                    });

                                }
                            });
                            var work_calendar_all = work_calendar_odd.concat(work_calendar_even);
                        }
                    }
                    var work_time = result.work_time;
                    var work_time_name = result.work_time_name;
                    if (!result.calendar_data) {
                        result.calendar_data = [];
                    }
                    _.each(days_arr, function(temp) {
                        var filter_data = _.find(result.calendar_data, function(data) {
                            return data.job_date == String(moment(temp).format('YYYY-MM-DD'))
                        });
                        if (!filter_data) {
                            var bool = _.find(work_calendar_all, function(work) {
                                return moment(temp).format('YYYY-MM-DD') == String(moment(work).format('YYYY-MM-DD'))
                            });
                            bool = bool ? true : false;
                            result.calendar_data.push({
                                job_date: moment(temp).format('YYYY-MM-DD'),
                                work_time_name: work_time_name,
                                work_time: work_time,
                                is_job_day: bool
                            })
                        }
                    })
                    result.save(cb);
                })
            },
            time: function(cb) {
                WorkTime.find({
                    client: client
                }).exec(cb)
            }
        }, function(err, result) {
            render_data.result = result.plan[0];
            render_data.worktime = result.time;
            res.render('admin/tm/workplan/bbform', render_data);
        })

    }
    //人员工作日历表
var pep_work_plan_calendar = function(req, res) {
        var i18n = req.i18n;
        var client = req.user.client.id;
        var pep_id = req.query.pep_id;
        var render_data = {
            title: '人员工作日历-视图',
            user: req.user,
        };
        async.parallel({
            plan: function(cb) {
                async.waterfall([

                    function(cb) {
                        async.parallel({
                            pep: function(cb) {
                                People.findById(pep_id).populate('tm_work_plan').select('people_name tm_work_plan').exec(cb)
                            },
                            calendar: function(cb) {
                                WorkCategory.find({
                                    client: client
                                }).exec(cb)
                            }
                        }, cb)
                    },
                    function(data, cb) {
                        var work_plan = data.pep.tm_work_plan;
                        var calendar = data.calendar;

                        async.times(work_plan.length, function(n, next) {
                            var result = work_plan[n];

                            //生成工作日历表
                            //工作日历
                            var expire_on = result.expire_on;
                            var expire_off = result.expire_off;
                            //时间区间中的时间
                            var days_between = moment(expire_off).diff(moment(expire_on), 'days');
                            var days_arr_even = [],
                                days_arr_odd = [],
                                days_arr = [];
                            for (var i = 0; i <= days_between; i++) {
                                var iterate_date = moment(expire_on).add('days', i);
                                var num = moment(iterate_date).weeks();
                                if (num % 2 != 0) {
                                    days_arr_even.push(iterate_date);
                                } else {
                                    days_arr_odd.push(iterate_date);
                                };
                                days_arr.push(iterate_date);
                            };
                            //取出该人员当前工作计划内的正常上班日期
                            if (result.work_calendar.length == 1 && result.work_calendar[0].which_calendar == 'A') {
                                var filter_calendar_data = _.find(calendar, function(temp) {
                                    return temp._id == String(result.work_calendar[0].calendar)
                                })
                                var cycle_period = _.map(filter_calendar_data.cycle_period, function(week) {
                                    return String(week.weekday);
                                });
                                var work_calendar_all = _.filter(days_arr, function(date) {
                                    return !!~cycle_period.indexOf(String(moment(date).days()))
                                });
                            } else {
                                if (result.work_calendar.length == 2) {
                                    var work_calendar_odd, work_calendar_even;
                                    _.each(result.work_calendar, function(temp) {
                                        var filter_calendar_data = _.find(calendar, function(cal) {
                                            return cal._id == String(temp.calendar)
                                        })
                                        if (temp.which_calendar == 'O') {
                                            var cycle_period_odd = _.map(filter_calendar_data.cycle_period, function(week) {
                                                return String(week.weekday);
                                            });

                                            work_calendar_odd = _.filter(days_arr_odd, function(date) {
                                                return !!~cycle_period_odd.indexOf(String(moment(date).days()))
                                            });
                                        } else if (temp.which_calendar == 'E') {
                                            var cycle_period_even = _.map(filter_calendar_data.cycle_period, function(week) {
                                                return String(week.weekday);
                                            });

                                            work_calendar_even = _.filter(days_arr_even, function(date) {
                                                return !!~cycle_period_even.indexOf(String(moment(date).days()))
                                            });

                                        }
                                    });
                                    var work_calendar_all = work_calendar_odd.concat(work_calendar_even);
                                }
                            }
                            var work_time = result.work_time;
                            var work_time_name = result.work_time_name;
                            var calendar_data = [];
                            _.each(days_arr, function(temp) {
                                var bool = _.find(work_calendar_all, function(work) {
                                    return moment(temp).format('YYYY-MM-DD') == String(moment(work).format('YYYY-MM-DD'))
                                });

                                bool = bool ? true : false;
                                calendar_data.push({
                                    work_plan: result._id,
                                    work_plan_name: result.plan_name,
                                    job_date: moment(temp).format('YYYY-MM-DD'),
                                    work_time_name: work_time_name,
                                    work_time: work_time,
                                    is_job_day: bool
                                })
                            })
                            next(null, calendar_data)
                        }, function(err, result) {
                            //在这里创建数据
                            var obj = {
                                client: client,
                                people: data.pep._id,
                            }
                            obj.calendar_data = result[0];
                            var temp_data = result[0];
                            PeopleWorkCalendar.findOne({
                                client: client,
                                people: pep_id,
                            }).exec(function(err, result) {
                                if (result) {
                                    if (result.calendar_data.length <= 0) {
                                        result.calendar_data = temp_data;
                                    }
                                    // result.calendar_data = temp_data;
                                    result.save(cb);
                                } else {
                                    PeopleWorkCalendar.create(obj, cb);
                                }
                            })
                        })
                    }
                ], cb)

            },
            time: function(cb) {
                WorkTime.find({
                    client: client
                }).exec(cb)
            },
            pep: function(cb) {
                People.findById(pep_id).select('people_name').exec(cb)
            }
        }, function(err, result) {
            render_data.result = result.plan[0] ? result.plan[0] : '';
            if (result.plan[0]) {
                if (result.plan[0].calendar_data) {
                    var sort_data = _.sortBy(result.plan[0].calendar_data, function(data) {
                        return moment(data.job_date).format('YYYYMMDD')
                    });
                    if (sort_data.length > 0) {
                        var expire_on = moment(sort_data[0].job_date).format('YYYY-MM-DD');
                        var expire_off = moment(sort_data.pop().job_date).format('YYYY-MM-DD');

                    }
                }

            }

            render_data.expire_on = expire_on ? expire_on : '';
            render_data.expire_off = expire_off ? expire_off : '';
            render_data.worktime = result.time;
            render_data.people_name = result.pep.people_name;
            res.render('admin/tm/cardrecord/pep_calendar', render_data);
        })

    }
    //人员日历工作表
var pep_work_plan_bb_list = function(req, res) {
    var i18n = req.i18n;
    var client = req.user.client.id;

    PeopleWorkCalendar.find({
        client: client
    }, function(err, sccs) {
        if (err) {
            return res.json({
                code: 'ERR',
                msg: '内部服务器错误：' + err
            });
        } else {
            return res.json(sccs);
        };
    })
}

var pep_work_plan_bb_fetch = function(req, res) {
    var i18n = req.i18n;
    var client = req.user.client.id;
    var sc_id = req.params.sc_id;

    PeopleWorkCalendar.findById(sc_id, function(err, scc) {
        if (err) {
            return res.json({
                code: 'ERR',
                msg: '内部服务器错误：' + err
            });
        } else {
            return res.json(scc);
        };
    });
}

var pep_work_plan_bb_update = function(req, res) {
        var i18n = req.i18n;
        var client = req.user.client.id;
        var sc_id = req.params.sc_id;
        var data4update = {
            client: client,
            people: req.body.people,
            calendar_data: req.body.calendar_data || null
        };
        PeopleWorkCalendar.findByIdAndUpdate(sc_id, data4update, function(err, scc) {
            if (err) {
                return res.status(500).json({
                    code: 'ERR',
                    msg: '内部服务器错误：' + err
                });
            };
            if (scc) {
                return res.json({
                    code: 'OK',
                    msg: sprintf('工作计划保存成功！'),
                    _id: scc._id,
                });
            } else {
                return res.status(500).json({
                    code: 'ERR',
                    msg: '工作计划保存失败'
                });
            };
        });
    }
    //我的团队-工作计划视图
var my_team_work_plan = function(req, res) {
        var client = req.user.client.id;
        var people = req.query.people || req.user.people._id;
        var people_name = req.query.people_name || req.user.people.people_name;
        var render_data = {
            title: '工作计划',
            user: req.user,
            people: people,
            people_name: people_name
        };
        async.parallel({

            init: function(cb) {
                PeopleWorkCalendar.findOne({
                    client: client,
                    people: people
                }).populate({
                    path: 'people',
                    select: 'people_name'
                }).exec(function(err, result) {
                    // if (result) {
                    //     cb(null, result)
                    // } else {
                    async.waterfall([

                        function(cb) {
                            async.parallel({
                                pep: function(cb) {
                                    People.findById(people).populate('tm_work_plan').select('people_name tm_work_plan').exec(cb)
                                },
                                calendar: function(cb) {
                                    WorkCategory.find({
                                        client: client
                                    }).exec(cb)
                                }
                            }, cb)
                        },
                        function(data, cb) {
                            var work_plan = data.pep.tm_work_plan;
                            var calendar = data.calendar;

                            async.times(work_plan.length, function(n, next) {
                                var result = work_plan[n];

                                //生成工作日历表
                                //工作日历
                                var expire_on = result.expire_on;
                                var expire_off = result.expire_off;
                                //时间区间中的时间
                                var days_between = moment(expire_off).diff(moment(expire_on), 'days');
                                var days_arr_even = [],
                                    days_arr_odd = [],
                                    days_arr = [];
                                for (var i = 0; i <= days_between; i++) {
                                    var iterate_date = moment(expire_on).add('days', i);
                                    var num = moment(iterate_date).weeks();
                                    if (num % 2 != 0) {
                                        days_arr_even.push(iterate_date);
                                    } else {
                                        days_arr_odd.push(iterate_date);
                                    };
                                    days_arr.push(iterate_date);
                                };
                                //取出该人员当前工作计划内的正常上班日期
                                if (result.work_calendar.length == 1 && result.work_calendar[0].which_calendar == 'A') {
                                    var filter_calendar_data = _.find(calendar, function(temp) {
                                        return temp._id == String(result.work_calendar[0].calendar)
                                    })
                                    var cycle_period = _.map(filter_calendar_data.cycle_period, function(week) {
                                        return String(week.weekday);
                                    });
                                    var work_calendar_all = _.filter(days_arr, function(date) {
                                        return !!~cycle_period.indexOf(String(moment(date).days()))
                                    });
                                } else {
                                    if (result.work_calendar.length == 2) {
                                        var work_calendar_odd, work_calendar_even;
                                        _.each(result.work_calendar, function(temp) {
                                            var filter_calendar_data = _.find(calendar, function(cal) {
                                                return cal._id == String(temp.calendar)
                                            })
                                            if (temp.which_calendar == 'O') {
                                                var cycle_period_odd = _.map(filter_calendar_data.cycle_period, function(week) {
                                                    return String(week.weekday);
                                                });

                                                work_calendar_odd = _.filter(days_arr_odd, function(date) {
                                                    return !!~cycle_period_odd.indexOf(String(moment(date).days()))
                                                });
                                            } else if (temp.which_calendar == 'E') {
                                                var cycle_period_even = _.map(filter_calendar_data.cycle_period, function(week) {
                                                    return String(week.weekday);
                                                });

                                                work_calendar_even = _.filter(days_arr_even, function(date) {
                                                    return !!~cycle_period_even.indexOf(String(moment(date).days()))
                                                });

                                            }
                                        });
                                        var work_calendar_all = work_calendar_odd.concat(work_calendar_even);
                                    }
                                }
                                var work_time = result.work_time;
                                var work_time_name = result.work_time_name;
                                var calendar_data = [];
                                _.each(days_arr, function(temp) {
                                    var bool = _.find(work_calendar_all, function(work) {
                                        return moment(temp).format('YYYY-MM-DD') == String(moment(work).format('YYYY-MM-DD'))
                                    });

                                    bool = bool ? true : false;
                                    calendar_data.push({
                                        work_plan: result._id,
                                        work_plan_name: result.plan_name,
                                        job_date: moment(temp).format('YYYY-MM-DD'),
                                        work_time_name: work_time_name,
                                        work_time: work_time,
                                        is_job_day: bool
                                    })
                                })
                                next(null, calendar_data)
                            }, function(err, result) {
                                //在这里创建数据
                                var obj = {
                                    client: client,
                                    people: data.pep._id,
                                }
                                obj.calendar_data = result[0];
                                PeopleWorkCalendar.findOne({
                                    client: client,
                                    people: people,
                                }).exec(function(err, data) {
                                    if (data) {
                                        if (data.calendar_data.length <= 0) {
                                            data.calendar_data = result[0];
                                        }
                                        data.save(cb);
                                    } else {
                                        PeopleWorkCalendar.create(obj, cb);
                                    }
                                })
                            })
                        }
                    ], cb)
                    // }
                })
            },
            time: function(cb) {
                WorkTime.find({
                    client: client
                }).exec(cb)
            },
        }, function(err, result) {
            render_data.result = result.init[0];
            render_data.people_name = people_name;
            if (result.init[0]) {
                if (result.init[0].calendar_data) {
                    var sort_data = _.sortBy(result.init[0].calendar_data, function(data) {
                        return moment(data.job_date).format('YYYYMMDD')
                    });
                    if (sort_data.length > 0) {
                        var expire_on = moment(sort_data[0].job_date).format('YYYY-MM-DD');
                        var expire_off = moment(sort_data.pop().job_date).format('YYYY-MM-DD');

                    }
                }

            }

            render_data.expire_on = expire_on ? expire_on : '';
            render_data.expire_off = expire_off ? expire_off : '';
            render_data.worktime = result.time;

            res.render('admin/tm/workplan/my_team', render_data);
        })

    }
    //我的团队-工作计划视图 V2
var my_team_work_plan_v2 = function(req, res) {
    var client = req.user.client.id;
    var people = req.query.people || req.user.people._id;
    var people_name = req.query.people_name || req.user.people.people_name;
    var render_data = {
        title: '工作计划',
        user: req.user,
        people: people,
        people_name: people_name
    };
    async.parallel({

        init: function(cb) {
            PeopleWorkCalendar.findOne({
                client: client,
                people: people
            }).populate({
                path: 'people',
                select: 'people_name'
            }).exec(function(err, result) {
                if (result) {
                    if (result.calendar_data.length <= 0) {
                        async.waterfall([

                            function(cb) {
                                async.parallel({
                                    pep: function(cb) {
                                        People.findById(people).populate('tm_work_plan').select('people_name tm_work_plan').exec(cb)
                                    },
                                    calendar: function(cb) {
                                        WorkCategory.find({
                                            client: client
                                        }).exec(cb)
                                    }
                                }, cb)
                            },
                            function(data, cb) {
                                var work_plan = data.pep.tm_work_plan;
                                var calendar = data.calendar;

                                async.times(work_plan.length, function(n, next) {
                                    var result = work_plan[n];

                                    //生成工作日历表
                                    //工作日历
                                    var expire_on = result.expire_on;
                                    var expire_off = result.expire_off;
                                    //时间区间中的时间
                                    var days_between = moment(expire_off).diff(moment(expire_on), 'days');
                                    var days_arr_even = [],
                                        days_arr_odd = [],
                                        days_arr = [];
                                    for (var i = 0; i <= days_between; i++) {
                                        var iterate_date = moment(expire_on).add('days', i);
                                        var num = moment(iterate_date).weeks();
                                        if (num % 2 != 0) {
                                            days_arr_even.push(iterate_date);
                                        } else {
                                            days_arr_odd.push(iterate_date);
                                        };
                                        days_arr.push(iterate_date);
                                    };
                                    //取出该人员当前工作计划内的正常上班日期
                                    if (result.work_calendar.length == 1 && result.work_calendar[0].which_calendar == 'A') {
                                        var filter_calendar_data = _.find(calendar, function(temp) {
                                            return temp._id == String(result.work_calendar[0].calendar)
                                        })
                                        var cycle_period = _.map(filter_calendar_data.cycle_period, function(week) {
                                            return String(week.weekday);
                                        });
                                        var work_calendar_all = _.filter(days_arr, function(date) {
                                            return !!~cycle_period.indexOf(String(moment(date).days()))
                                        });
                                    } else {
                                        if (result.work_calendar.length == 2) {
                                            var work_calendar_odd, work_calendar_even;
                                            _.each(result.work_calendar, function(temp) {
                                                var filter_calendar_data = _.find(calendar, function(cal) {
                                                    return cal._id == String(temp.calendar)
                                                })
                                                if (temp.which_calendar == 'O') {
                                                    var cycle_period_odd = _.map(filter_calendar_data.cycle_period, function(week) {
                                                        return String(week.weekday);
                                                    });

                                                    work_calendar_odd = _.filter(days_arr_odd, function(date) {
                                                        return !!~cycle_period_odd.indexOf(String(moment(date).days()))
                                                    });
                                                } else if (temp.which_calendar == 'E') {
                                                    var cycle_period_even = _.map(filter_calendar_data.cycle_period, function(week) {
                                                        return String(week.weekday);
                                                    });

                                                    work_calendar_even = _.filter(days_arr_even, function(date) {
                                                        return !!~cycle_period_even.indexOf(String(moment(date).days()))
                                                    });

                                                }
                                            });
                                            var work_calendar_all = work_calendar_odd.concat(work_calendar_even);
                                        }
                                    }
                                    var work_time = result.work_time;
                                    var work_time_name = result.work_time_name;
                                    var calendar_data = [];
                                    _.each(days_arr, function(temp) {
                                        var bool = _.find(work_calendar_all, function(work) {
                                            return moment(temp).format('YYYY-MM-DD') == String(moment(work).format('YYYY-MM-DD'))
                                        });

                                        bool = bool ? true : false;
                                        calendar_data.push({
                                            work_plan: result._id,
                                            work_plan_name: result.plan_name,
                                            job_date: moment(temp).format('YYYY-MM-DD'),
                                            work_time_name: work_time_name,
                                            work_time: work_time,
                                            is_job_day: bool
                                        })
                                    })
                                    next(null, calendar_data)
                                }, function(err, d) {
                                    //在这里创建数据
                                    result.calendar_data = d[0];
                                    result.save(cb);
                                })
                            }
                        ], cb)
                    } else {
                        result.save(cb);

                    }


                } else {
                    async.waterfall([

                        function(cb) {
                            async.parallel({
                                pep: function(cb) {
                                    People.findById(people).populate('tm_work_plan').select('people_name tm_work_plan').exec(cb)
                                },
                                calendar: function(cb) {
                                    WorkCategory.find({
                                        client: client
                                    }).exec(cb)
                                }
                            }, cb)
                        },
                        function(data, cb) {
                            var work_plan = data.pep.tm_work_plan;
                            var calendar = data.calendar;
                            async.times(work_plan.length, function(n, next) {
                                var result = work_plan[n];

                                //生成工作日历表
                                //工作日历
                                var expire_on = result.expire_on;
                                var expire_off = result.expire_off;
                                //时间区间中的时间
                                var days_between = moment(expire_off).diff(moment(expire_on), 'days');
                                var days_arr_even = [],
                                    days_arr_odd = [],
                                    days_arr = [];
                                for (var i = 0; i <= days_between; i++) {
                                    var iterate_date = moment(expire_on).add('days', i);
                                    var num = moment(iterate_date).weeks();
                                    if (num % 2 != 0) {
                                        days_arr_even.push(iterate_date);
                                    } else {
                                        days_arr_odd.push(iterate_date);
                                    };
                                    days_arr.push(iterate_date);
                                };
                                //取出该人员当前工作计划内的正常上班日期
                                if (result.work_calendar.length == 1 && result.work_calendar[0].which_calendar == 'A') {
                                    var filter_calendar_data = _.find(calendar, function(temp) {
                                        return temp._id == String(result.work_calendar[0].calendar)
                                    })
                                    var cycle_period = _.map(filter_calendar_data.cycle_period, function(week) {
                                        return String(week.weekday);
                                    });
                                    var work_calendar_all = _.filter(days_arr, function(date) {
                                        return !!~cycle_period.indexOf(String(moment(date).days()))
                                    });
                                } else {
                                    if (result.work_calendar.length == 2) {
                                        var work_calendar_odd, work_calendar_even;
                                        _.each(result.work_calendar, function(temp) {
                                            var filter_calendar_data = _.find(calendar, function(cal) {
                                                return cal._id == String(temp.calendar)
                                            })
                                            if (temp.which_calendar == 'O') {
                                                var cycle_period_odd = _.map(filter_calendar_data.cycle_period, function(week) {
                                                    return String(week.weekday);
                                                });

                                                work_calendar_odd = _.filter(days_arr_odd, function(date) {
                                                    return !!~cycle_period_odd.indexOf(String(moment(date).days()))
                                                });
                                            } else if (temp.which_calendar == 'E') {
                                                var cycle_period_even = _.map(filter_calendar_data.cycle_period, function(week) {
                                                    return String(week.weekday);
                                                });

                                                work_calendar_even = _.filter(days_arr_even, function(date) {
                                                    return !!~cycle_period_even.indexOf(String(moment(date).days()))
                                                });

                                            }
                                        });
                                        var work_calendar_all = work_calendar_odd.concat(work_calendar_even);
                                    }
                                }
                                var work_time = result.work_time;
                                var work_time_name = result.work_time_name;
                                var calendar_data = [];
                                _.each(days_arr, function(temp) {
                                    var bool = _.find(work_calendar_all, function(work) {
                                        return moment(temp).format('YYYY-MM-DD') == String(moment(work).format('YYYY-MM-DD'))
                                    });

                                    bool = bool ? true : false;
                                    calendar_data.push({
                                        work_plan: result._id,
                                        work_plan_name: result.plan_name,
                                        job_date: moment(temp).format('YYYY-MM-DD'),
                                        work_time_name: work_time_name,
                                        work_time: work_time,
                                        is_job_day: bool
                                    })
                                })
                                next(null, calendar_data)
                            }, function(err, result) {
                                //在这里创建数据
                                var obj = {
                                    client: client,
                                    people: data.pep._id,
                                }
                                obj.calendar_data = result[0];
                                PeopleWorkCalendar.create(obj, cb);
                            })
                        }
                    ], cb)
                }
            })
        },
        time: function(cb) {
            WorkTime.find({
                client: client
            }).exec(cb)
        },
    }, function(err, result) {
        render_data.result = result.init[0];
        render_data.people_name = people_name;
        if (result.init[0]) {
            if (result.init[0].calendar_data) {
                var sort_data = _.sortBy(result.init[0].calendar_data, function(data) {
                    return moment(data.job_date).format('YYYYMMDD')
                });
                if (sort_data.length > 0) {
                    var expire_on = moment(sort_data[0].job_date).format('YYYY-MM-DD');
                    var expire_off = moment(sort_data.pop().job_date).format('YYYY-MM-DD');

                }
            }

        }

        render_data.expire_on = expire_on ? expire_on : '';
        render_data.expire_off = expire_off ? expire_off : '';
        render_data.worktime = result.time;

        res.render('admin/tm/workplan/my_team_v2', render_data);
    })

}
var people_select_work_plan = function(req, res) {
    var client = req.user.client.id;
    var people = req.body.people || req.user.people._id;
    var people_name = req.body.people_name || req.user.people.people_name;
    async.parallel({

        init: function(cb) {
            PeopleWorkCalendar.findOne({
                client: client,
                people: people
            }).populate({
                path: 'people',
                select: 'people_name'
            }).exec(function(err, result) {
                async.waterfall([

                    function(cb) {
                        async.parallel({
                            pep: function(cb) {
                                People.findById(people).populate('tm_work_plan').select('people_name tm_work_plan').exec(cb)
                            },
                            calendar: function(cb) {
                                WorkCategory.find({
                                    client: client
                                }).exec(cb)
                            }
                        }, cb)
                    },
                    function(data, cb) {
                        var work_plan = data.pep.tm_work_plan;
                        var calendar = data.calendar;
                        var now = new Date();
                        //选择当前时间所在的工作计划并往后推三个月,不足三个月，取已有的数据,只有一个
                        var filter_work_plan = _.find(work_plan, function(temp) {
                            return moment(now).isBefore(moment(temp.expire_off)) && moment(now).isAfter(moment(temp.expire_on))
                        })
                        console.log(filter_work_plan);
                        // async.times(work_plan.length, function(n, next) {
                        //     var result = work_plan[n];

                        //     //生成工作日历表
                        //     //工作日历
                        //     var expire_on = result.expire_on;
                        //     var expire_off = result.expire_off;
                        //     //时间区间中的时间
                        //     var days_between = moment(expire_off).diff(moment(expire_on), 'days');
                        //     var days_arr_even = [],
                        //         days_arr_odd = [],
                        //         days_arr = [];
                        //     for (var i = 0; i <= days_between; i++) {
                        //         var iterate_date = moment(expire_on).add('days', i);
                        //         var num = moment(iterate_date).weeks();
                        //         if (num % 2 != 0) {
                        //             days_arr_even.push(iterate_date);
                        //         } else {
                        //             days_arr_odd.push(iterate_date);
                        //         };
                        //         days_arr.push(iterate_date);
                        //     };
                        //     //取出该人员当前工作计划内的正常上班日期
                        //     if (result.work_calendar.length == 1 && result.work_calendar[0].which_calendar == 'A') {
                        //         var filter_calendar_data = _.find(calendar, function(temp) {
                        //             return temp._id == String(result.work_calendar[0].calendar)
                        //         })
                        //         var cycle_period = _.map(filter_calendar_data.cycle_period, function(week) {
                        //             return String(week.weekday);
                        //         });
                        //         var work_calendar_all = _.filter(days_arr, function(date) {
                        //             return !!~cycle_period.indexOf(String(moment(date).days()))
                        //         });
                        //     } else {
                        //         if (result.work_calendar.length == 2) {
                        //             var work_calendar_odd, work_calendar_even;
                        //             _.each(result.work_calendar, function(temp) {
                        //                 var filter_calendar_data = _.find(calendar, function(cal) {
                        //                     return cal._id == String(temp.calendar)
                        //                 })
                        //                 if (temp.which_calendar == 'O') {
                        //                     var cycle_period_odd = _.map(filter_calendar_data.cycle_period, function(week) {
                        //                         return String(week.weekday);
                        //                     });

                        //                     work_calendar_odd = _.filter(days_arr_odd, function(date) {
                        //                         return !!~cycle_period_odd.indexOf(String(moment(date).days()))
                        //                     });
                        //                 } else if (temp.which_calendar == 'E') {
                        //                     var cycle_period_even = _.map(filter_calendar_data.cycle_period, function(week) {
                        //                         return String(week.weekday);
                        //                     });

                        //                     work_calendar_even = _.filter(days_arr_even, function(date) {
                        //                         return !!~cycle_period_even.indexOf(String(moment(date).days()))
                        //                     });

                        //                 }
                        //             });
                        //             var work_calendar_all = work_calendar_odd.concat(work_calendar_even);
                        //         }
                        //     }
                        //     var work_time = result.work_time;
                        //     var work_time_name = result.work_time_name;
                        //     var calendar_data = [];
                        //     _.each(days_arr, function(temp) {
                        //         var bool = _.find(work_calendar_all, function(work) {
                        //             return moment(temp).format('YYYY-MM-DD') == String(moment(work).format('YYYY-MM-DD'))
                        //         });

                        //         bool = bool ? true : false;
                        //         calendar_data.push({
                        //             work_plan: result._id,
                        //             work_plan_name: result.plan_name,
                        //             job_date: moment(temp).format('YYYY-MM-DD'),
                        //             work_time_name: work_time_name,
                        //             work_time: work_time,
                        //             is_job_day: bool
                        //         })
                        //     })
                        //     next(null, calendar_data)
                        // }, function(err, result) {
                        //     //在这里创建数据
                        //     var obj = {
                        //         client: client,
                        //         people: data.pep._id,
                        //     }
                        //     obj.calendar_data = result[0];
                        //     var cal_temp_data = result[0];
                        //     PeopleWorkCalendar.findOne({
                        //         client: client,
                        //         people: people,
                        //     }).exec(function(err, result) {
                        //         if (result) {
                        //             if (result.calendar_data.length <= 0) {
                        //                 result.calendar_data = cal_temp_data;
                        //             }
                        //             result.save(cb);
                        //         } else {
                        //             PeopleWorkCalendar.create(obj, cb);
                        //         }
                        //     })
                        // })
                    }
                ], cb)
                // }
            })
        },
        time: function(cb) {
            WorkTime.find({
                client: client
            }).exec(cb)
        },
    }, function(err, result) {
        var temp_data = result.init;
        if (temp_data[0]) {
            if (temp_data[0].calendar_data) {
                var sort_data = _.sortBy(temp_data[0].calendar_data, function(data) {
                    return moment(data.job_date).format('YYYYMMDD')
                });
                if (sort_data.length > 0) {
                    var expire_on = moment(sort_data[0].job_date).format('YYYY-MM-DD');
                    var expire_off = moment(sort_data.pop().job_date).format('YYYY-MM-DD');

                }
            }

        }
        return res.json({
            code: 'OK',
            worktime: result.time,
            expire_on: expire_on ? expire_on : '',
            expire_off: expire_off ? expire_off : '',
            people_name: people_name,
            result: result.init[0]
        })
    })
}
module.exports = function(app, checkAuth) {
    var __base_path = '/admin/tm/workplan';
    app.get(__base_path + '/bbform', checkAuth, work_plan_bb_form); //表单
    app.get(__base_path + '/bb', checkAuth, work_plan_bb_list); //列表
    app.get(__base_path + '/bb/:sc_id', checkAuth, work_plan_bb_fetch); //获取
    app.post(__base_path + '/bb/:sc_id', checkAuth, work_plan_bb_create); //新建的保存
    app.put(__base_path + '/bb/:sc_id', checkAuth, work_plan_bb_update); //更新的保存
    app.delete(__base_path + '/bb/:sc_id', checkAuth, work_plan_bb_delete); //删除

    app.post(__base_path + '/typeahead', checkAuth, work_plan_typeahead);
    app.get(__base_path + '/input_help', checkAuth, work_plan_inputhelp);
    app.get(__base_path + '/form', checkAuth, work_plan_bb_edit); //更新的保存
    app.post(__base_path + '/save', checkAuth, work_plan_bb_save); //更新的保存
    app.get(__base_path + '/get_data', checkAuth, work_plan_get_data); //更新的保存
    app.get(__base_path + '/calendar', checkAuth, work_plan_calendar); //更新的保存
    //生成人员可更改工作日历表
    app.get(__base_path + '/pep_calendar', checkAuth, pep_work_plan_calendar); //更新的保存
    app.get(__base_path + '/pep_bb', checkAuth, pep_work_plan_bb_list); //列表
    app.get(__base_path + '/pep_bb/:sc_id', checkAuth, pep_work_plan_bb_fetch); //获取
    app.put(__base_path + '/pep_bb/:sc_id', checkAuth, pep_work_plan_bb_update); //更新的保存
    //我的下属-工作计划
    app.get(__base_path + '/my_team', checkAuth, my_team_work_plan); //列表
    //我的下属-工作计划V2
    //1.只显示两级下属   2.人员可以多选
    app.get(__base_path + '/my_team_v2', checkAuth, my_team_work_plan_v2); //列表

    app.post(__base_path + '/people_select', checkAuth, people_select_work_plan); //列表

}
