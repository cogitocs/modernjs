var sprintf = require('sprintf').sprintf;
var CardRecord = require('../../models/tm').CardRecord;
//version 2
var PeopleCardRecord = require('../../models/tm').PeopleCardRecord;

var Company = require('../../models/structure').Company;
var async = require('async');
var us = require('underscore');
var moment = require('moment');
var People = require('../../models/people').People;
var Position = require('../../models/position').Position;
var OrganizationUnit = require('../../models/organization').OrganizationUnit;
var PeopleFactor = require('../../models/pm').PeopleFactor;
var WorkTime = require('../../models/tm').WorkTime;
var WorkCategory = require('../../models/tm').WorkCategory;
var CardRecordPayroll = require('../../models/tm').CardRecordPayroll;
var TmWorkPlan = require('../../models/tm').TmWorkPlan;
//工作计划
var TmWorkPlan = require('../../models/tm').TmWorkPlan;
//考勤结论中间表
var AttendanceResult = require('../../models/tm').AttendanceResult;
//节假日
var NationHoliday = require('../../models/tm').NationHoliday;
//工作时间
var WorkTime = require('../../models/tm').WorkTime;
var util = require("util");
//工作日历
var WorkCategory = require('../../models/tm').WorkCategory;
//打卡记录
var CardRecord = require('../../models/tm').CardRecord;
var CardRecordPayroll = require('../../models/tm').CardRecordPayroll;
var AttendanceResult = require('../../models/tm').AttendanceResult;
//人员工作日历表
var PeopleWorkCalendar = require('../../models/tm').PeopleWorkCalendar;
var SignStyleConfig = require('../../models/tm').SignStyleConfig;
//加班、请假、差旅、公干流程
var TMLeaveOfAbsence = require('../../models/tm').TMLeaveOfAbsence;
var TmAbsenceOfThree = require('../../models/tm').TmAbsenceOfThree;
var BeyondWorkPayroll = require('../../models/tm').BeyondWorkPayroll;
var AttendanceResultChange = require('../../models/tm').AttendanceResultChange;

//签到优先级
var SignStyleConfig = require('../../models/tm').SignStyleConfig;

//for import
var fs = require('fs');
var path = require('path');
var exec = require('child_process').exec;

//每日打卡
var card_record_list = function(req, res) {
    var i18n = req.i18n;
    var client = req.user.client.id;
    var people = req.user.people.id;
    var render_data = {
        title: '每日打卡',
        user: req.user,
        _: us,
        moment: moment
    };
    var createdata = {
        client: client,
        people: req.user.people
    }
    async.series({
        create: function(cb) {
            PeCardRecord.find({
                client: client,
                people: req.user.people.id
            }).exec(function(err, result) {
                if (result.length > 0) {
                    cb(null, result)
                } else {
                    CardRecord.create(createdata, cb)
                }
            })
        },
        people: function(cb) {
            People.findById(req.user.people.id).populate('work_time tm_work_plan').select('work_time tm_work_plan').exec(cb)
        },
        work_time: function(cb) {
            WorkTime.find({
                client: client
            }).exec(cb)
        },
        pep_calendar: function(cb) {
            PeopleWorkCalendar.findOne({
                client: client,
                people: people
            }).populate('calendar_data.work_time').exec(cb)
        }
    }, function(err, result) {
        var pep_data = result.people ? result.people : '';
        var pep_calendar = result.people ? result.people.tm_work_plan : '';
        var pep_work_calendar = result.pep_calendar ? result.pep_calendar : '';
        var work_time = result.work_time ? result.work_time : '';

        render_data.sign_on_time = pep_data.work_time ? pep_data.work_time.sign_on_time : '';
        render_data.sign_off_end_time = pep_data.work_time ? pep_data.work_time.sign_off_end_time : '';

        CardRecord.find({
            client: client,
            people: req.user.people.id
        }).exec(function(err, result) {
            render_data.record_id = result[0].id;

            if (result[0].record_data) {
                //根据人员的工作时间 来显示哪一天的打卡记录(根据工作时间里的上下班时间来显示跨天的打卡数据)
                var yesterday = moment(new Date()).subtract('days', 1).format('YYYY-MM-DD');
                var today = moment(new Date()).format('YYYY-MM-DD');
                var now_time = moment(new Date()).format('HH:mm');
                //前一天的工作时间
                var people_yes_work_time = get_work_time(pep_work_calendar, pep_calendar, work_time, yesterday);
                //当天工作时间
                var people_today_work_time = get_work_time(pep_work_calendar, pep_calendar, work_time, today);

                if (people_yes_work_time) {
                    if (people_yes_work_time.is_cross_day) {
                        //如果时间在当天打卡上班以前，则显示前一天的打卡记录(上班打卡记录)
                        if (moment.duration(now_time) - moment.duration(people_today_work_time.work_on_time) < 0) {
                            var card_data = _.find(result[0].record_data, function(r) {
                                return r.card_time == String(yesterday)
                            })
                        } else {
                            var card_data = _.find(result[0].record_data, function(r) {
                                return r.card_time == String(today)
                            })

                        }

                    } else {
                        var card_data = _.find(result[0].record_data, function(r) {
                            return r.card_time == String(today)
                        })
                    }
                } else {
                    var card_data = _.find(result[0].record_data, function(r) {
                        return r.card_time == String(today)
                    })

                }
                render_data.come_time = card_data ? card_data.come_time : '';
                render_data.leave_time = card_data ? card_data.leave_time : '';
                render_data.come = card_data ? card_data.come : '';
                render_data.leave = card_data ? card_data.leave : '';

            } else {
                render_data.come_time = '';
                render_data.leave_time = '';
                render_data.come = [];
                render_data.leave = [];

            }
            res.render('admin/tm/cardrecord/list', render_data);

        })
    })

}

function get_work_time(pep_work_calendar, pep_calendar, work_time, date) {
    if (pep_work_calendar) {
        var single_calendar_data = _.find(pep_work_calendar.calendar_data, function(temp) {
            return temp.job_date == String(date)
        });
        if (single_calendar_data) {
            return single_calendar_data.work_time;
        } else {
            return null;
        }
    } else {
        if (pep_calendar.length > 1) {
            var single_pep_calendar = _.find(pep_calendar, function(temp) {
                return moment(date).isAfter(temp.expire_on) && moment(date).isBefore(temp.expire_off)
            })
        } else {
            var single_pep_calendar = pep_calendar[0];
        }
        if (single_pep_calendar.calendar_data > 0) {
            var calendar_data = single_pep_calendar.calendar_data;
            var single_calendar_data = _.find(calendar_data, function(temp) {
                return temp.job_date == String(date)
            });
            if (single_calendar_data) {
                var single_work_time = _.find(work_time, function(time) {
                    return time._id == String(single_calendar_data.work_time)
                })
                return single_work_time;
            } else {
                return null;
            }
        } else {
            var single_work_time = _.find(work_time, function(time) {
                return time._id == String(single_pep_calendar.work_time)
            })
            return single_work_time;
        }


    }
}
var card_record_bb_list = function(req, res) {
    var i18n = req.i18n;
    var client = req.user.client.id;
    CardRecord.find({
        client: client,
    }).exec(function(err, result) {
        if (err) {
            return res.json({
                code: 'ERR',
                msg: '内部服务器错误：' + err
            });
        } else {
            return res.json(result);
        };
    })
}
var card_record_bb_fetch = function(req, res) {
    var i18n = req.i18n;
    var up_id = req.params.up_id;
    async.waterfall([

        function(cb) {
            CardRecord.findById(up_id).exec(cb);
        },
    ], function(err, result) {
        if (err) {
            return res.json({
                code: 'ERR',
                msg: '内部服务器错误：' + err
            });
        } else {
            return res.json(result);
        };
    })
}
var card_record_bb_update = function(req, res) {
        var i18n = req.i18n;
        var client = req.user.client.id;
        var up_id = req.params.up_id;
        var record_data = req.body.record_data;
        var temp_arr = [];
        _.each(record_data, function(temp) {
            temp_arr.push({
                card_time: temp.card_time,
                come_time: temp.come_time,
                leave_time: temp.leave_time,
                c_comment: temp.c_comment,
                l_comment: temp.l_comment,
                come: temp.come,
                leave: temp.leave,
                is_l_change: temp.is_l_change,
                is_c_change: temp.is_c_change,
                c_reason: temp.c_reason ? temp.c_reason : '',
                l_reason: temp.l_reason ? temp.l_reason : '',
                c_c_time: temp.c_c_time ? temp.c_c_time : '',
                l_c_time: temp.l_c_time ? temp.l_c_time : ''
            })
        })
        var updatedata = {
            client: client,
            record_data: temp_arr,
            people: req.user.people.id
        }
        CardRecord.findByIdAndUpdate(up_id, updatedata, function(err, result) {
            if (err) {
                return res.status(500).json({
                    code: 'ERR',
                    msg: '内部服务器错误：' + err
                });
            };
            if (result) {
                return res.json({
                    code: 'OK',
                    msg: sprintf('打卡记录保存成功！'),
                    _id: result._id,
                });
            } else {
                return res.status(500).json({
                    code: 'ERR',
                    msg: '打卡记录保存失败'
                });
            };
        })
    }
    //我的打卡列表
var my_card_record_list = function(req, res) {
    var i18n = req.i18n;
    var client = req.user.client.id;

    var render_data = {
        title: '我的打卡记录-列表',
        user: req.user,
        _: us,
        moment: moment
    };
    CardRecord.find({
        client: client,
        people: req.user.people.id
    }).exec(function(err, result) {
        render_data.record_id = result[0].id;
        res.render('admin/tm/cardrecord/record_list', render_data);

    })

}
var tm_config = function(req, res) {
        var i18n = req.i18n;
        var client = req.user.client.id;

        var render_data = {
            title: '时间管理-配置',
            user: req.user,
        };
        res.render('admin/tm/cardrecord/panel', render_data);


    }
    //HR修改界面
var hr_card_record_list = function(req, res) {
    var i18n = req.i18n;
    var client = req.user.client.id;

    var render_data = {
        title: '打卡记录-列表',
        user: req.user,
        _: us,
        moment: moment
    };
    res.render('admin/tm/cardrecord/hr_list', render_data);

};
//HR修改界面version2
var hr_card_record_list_v2 = function(req, res) {
    var i18n = req.i18n;
    var client = req.user.client.id;
    var pep_id = req.query.pep_id || req.user.people._id;
    var is_self = _.isEqual(String(pep_id), String(req.user.people._id));
    var render_data = {
        title: '人员考勤日志-列表',
        user: req.user,
        _: us,
        moment: moment
    };
    async.parallel({
        attend_result: function(cb) {
            AttendanceResult.find({
                client: client,
                people: pep_id
            }).populate({
                path: 'people',
                select: '_id people_name is_positive_attendance'
            }).populate('data.work_plan').exec(cb)
        }
    }, function(err, result) {
        var attend_result = result.attend_result;
        var union_arr = [],
            obj = {};
        _.each(attend_result, function(data) {
            _.each(data.data, function(temp) {
                if ((temp.is_job_day || temp.is_beyond_work) && moment(temp.job_date).format('YYYY-MM') == String(moment().format('YYYY-MM'))) {
                    obj[temp._id] = temp.work_plan._id;
                    union_arr.push(temp);
                }
            })
        });
        render_data.union_arr = union_arr;
        render_data.pep_id = attend_result[0] ? attend_result[0].people._id : '';
        render_data.work_plan = obj;
        render_data.people_name = attend_result[0] ? attend_result[0].people.people_name : '';
        //上班未打卡
        var on_no_card = _.filter(union_arr, function(data) {
            return !!~data.work_result.indexOf('NCM')
        })
        render_data.on_no_card = '上班未打卡:  ' + on_no_card.length + '次';
        //迟到(分钟)
        //下班未打卡(次)
        var off_no_card = _.filter(union_arr, function(data) {
            return !!~data.work_result.indexOf('NCA')
        })
        render_data.off_no_card = '下班未打卡:  ' + off_no_card.length + '次';

        //早退(分钟)
        //旷工(天)
        var absence_num = _.filter(union_arr, function(data) {
            return !!~data.work_result.indexOf('A')
        })
        render_data.absence_num = '旷工:  ' + absence_num.length + '天';
        render_data.is_self = is_self;
        res.render('admin/tm/cardrecord/hr_list_v2', render_data);

    })

}
var hr_card_record_edit = function(req, res) {
        var i18n = req.i18n;
        var client = req.user.client.id;
        var people = req.query.people;
        var card_time = String(req.query.card_time);
        var render_data = {
            title: '打卡记录-修改',
            user: req.user,
            _: us,
            moment: moment
        };
        CardRecord.findOne({
            client: client,
            people: people
        }).populate({
            path: 'people',
            select: 'people_name position_name'
        }).exec(function(err, result) {
            render_data.record_id = result ? result._id : '';
            render_data.people_name = result ? result.people.people_name : '';
            render_data.position_name = result ? result.people.position_name : '';
            if (result) {
                var data = _.find(result.record_data, function(data) {
                    return data.card_time == String(card_time);
                });
            }
            render_data.data = data ? data : '';
            res.render('admin/tm/cardrecord/single_edit', render_data);

        })
    }
    //人员工作时间和工作日历赋予
var pep_work_time = function(req, res) {
    var i18n = req.i18n;
    var client = req.user.client.id;

    var render_data = {
        title: '人员工作时间-赋予',
        user: req.user,
        _: us,
        moment: moment
    };
    People.find({
        client: client,
        block: false,
        employee_status: {
            $ne: 'R'
        },
        company: {
            $in: req.user.companies
        }
    }).select('_id people_name position_name people_no company_name').exec(function(err, result) {
        render_data.pep_data = result;
        res.render('admin/tm/cardrecord/pep_work', render_data);

    })
}
var pep_work_batch = function(req, res) {
    var i18n = req.i18n;
    var client = req.user.client.id;

    var render_data = {
        title: '人员工作时间-赋予',
        user: req.user,
        _: us,
        moment: moment
    };
    async.parallel({
        work_plan: function(cb) {
            TmWorkPlan.find({
                client: client
            }).exec(cb)
        },
        // work_calendar: function(cb) {
        //     WorkCategory.find({
        //         client: client
        //     }).exec(cb)
        // }
    }, function(err, result) {
        render_data.work_plan = result.work_plan;
        // render_data.work_calendar = result.work_calendar;
        res.render('admin/tm/cardrecord/pep_list', render_data);

    })

}
var time_position_help_json = function(req, res) {
        var client = req.user.client;
        var c_type = req.params.c_type;
        var cond = {
            client: client
        };
        if (c_type == 'c') {
            cond.tm_work_plan = null;
        } else {
            cond.tm_work_plan = {
                $ne: null
            }
        }
        async.waterfall([

            function(cb) {
                async.parallel({
                    companys: function(cb) {
                        Company.find({
                            _id: {
                                $in: req.user.companies
                            },
                        }, cb);
                    },
                    ous: function(cb) {
                        OrganizationUnit.find({
                            client: client.id,
                            company: {
                                $in: req.user.companies
                            },
                        }).populate('parent_ou').exec(cb);
                    },
                    pos: function(cb) {
                        Position.find({
                            client: client.id,
                            company: {
                                $in: req.user.companies
                            },
                        }).populate('position_direct_superior belongto_ou').exec(cb);
                    },
                    pep: function(cb) {
                        People.find(cond).populate('position').select('position').exec(function(err, positions) {
                            if (positions.length > 0) {
                                var pps = [];
                                us.each(positions, function(s) {
                                    if (s.position) {
                                        pps.push(String(s.position._id))

                                    }
                                })
                                cb(null, pps)
                            } else {
                                cb(null, null)
                            }
                        })
                    }
                }, cb);
            },
            function(dc, cb) {
                var ret_data = [];
                _.each(dc.companys, function(d) {
                    var row = {
                        'id': d._id,
                        'pId': null,
                        'name': d.company_name,
                        'type': 'c'
                    };
                    ret_data.push(row);
                    var f_os = us.filter(dc.ous, function(o) {
                        return o.company == String(d._id)
                    })
                    _.each(f_os, function(o) {
                        if (!o.parent_ou) {
                            var row = {
                                'id': o._id,
                                'pId': d._id,
                                'name': o.ou_name,
                                'type': 'o'
                            };
                            ret_data.push(row);
                        } else {
                            if (o.parent_ou.company == String(d._id)) {
                                var row = {
                                    'id': o._id,
                                    'pId': o.parent_ou._id,
                                    'name': o.ou_name,
                                    'type': 'o'
                                };
                                ret_data.push(row);
                            } else {
                                var row = {
                                    'id': o._id,
                                    'pId': d._id,
                                    'name': o.ou_name,
                                    'type': 'o'
                                };
                                ret_data.push(row);
                            }
                        }
                        var o_p = _.filter(dc.pos, function(p) {
                            return !!~dc.pep.indexOf(String(p._id))
                        })
                        var f_ps = _.filter(o_p, function(p) {
                            return p.belongto_ou._id == String(o._id)
                        })
                        _.each(f_ps, function(p) {
                            if (p.position_manager) {
                                if (!p.position_direct_superior) {
                                    var row = {
                                        'id': p._id,
                                        'pId': o._id,
                                        'name': sprintf('<span class="label label-info" style="padding:1px;">%s</span>', p.position_name),
                                        'type': 'p'
                                    };
                                    ret_data.push(row);
                                } else {
                                    if (p.position_direct_superior.belongto_ou._id == String(o._id)) {
                                        var row = {
                                            'id': p._id,
                                            'pId': p.position_direct_superior._id,
                                            'name': sprintf('<span class="label label-info" style="padding:1px;">%s</span>', p.position_name),
                                            'type': 'p'
                                        };
                                        ret_data.push(row);
                                    } else {
                                        var row = {
                                            'id': p._id,
                                            'pId': o._id,
                                            'name': sprintf('<span class="label label-info" style="padding:1px;">%s</span>', p.position_name),
                                            'type': 'p'
                                        };
                                        ret_data.push(row);
                                    }
                                }
                            } else {
                                if (!p.position_direct_superior) {
                                    var row = {
                                        'id': p._id,
                                        'pId': o._id,
                                        'name': p.position_name,
                                        'type': 'p'
                                    };
                                    ret_data.push(row);
                                } else {
                                    if (p.position_direct_superior.belongto_ou._id == String(o._id)) {
                                        var row = {
                                            'id': p._id,
                                            'pId': p.position_direct_superior._id,
                                            'name': p.position_name,
                                            'type': 'p'
                                        };
                                        ret_data.push(row);
                                    } else {
                                        var row = {
                                            'id': p._id,
                                            'pId': o._id,
                                            'name': p.position_name,
                                            'type': 'p'
                                        };
                                        ret_data.push(row);
                                    }
                                }
                            }


                        })
                    })


                })

                cb(null, ret_data);
            }
        ], function(err, result) {
            res.send(result);
        })
    }
    // var calendar_position_help_json = function(req, res) {
    //     var client = req.user.client;
    //     var c_type = req.params.c_type;
    //     var cond = {
    //         client: client
    //     };
    //     if (c_type == 'c') {
    //         cond.work_calendar = null;
    //     } else {
    //         cond.work_calendar = {
    //             $ne: null
    //         }
    //     }
    //     async.waterfall([

//         function(cb) {
//             async.parallel({
//                 companys: function(cb) {
//                     Company.find({
//                         _id: {
//                             $in: req.user.companies
//                         },
//                     }, cb);
//                 },
//                 ous: function(cb) {
//                     OrganizationUnit.find({
//                         client: client.id,
//                         company: {
//                             $in: req.user.companies
//                         },
//                     }).populate('parent_ou').exec(cb);
//                 },
//                 pos: function(cb) {
//                     Position.find({
//                         client: client.id,
//                         company: {
//                             $in: req.user.companies
//                         },
//                     }).populate('position_direct_superior belongto_ou').exec(cb);
//                 },
//                 pep: function(cb) {
//                     People.find(cond).populate('position').select('position').exec(function(err, positions) {
//                         if (positions.length > 0) {
//                             var pps = [];
//                             us.each(positions, function(s) {
//                                 if (s.position) {
//                                     pps.push(String(s.position._id))

//                                 }
//                             })
//                             cb(null, pps)
//                         };
//                     })
//                 }
//             }, cb);
//         },
//         function(dc, cb) {
//             var ret_data = [];
//             _.each(dc.companys, function(d) {
//                 var row = {
//                     'id': d._id,
//                     'pId': null,
//                     'name': d.company_name,
//                     'type': 'c'
//                 };
//                 ret_data.push(row);
//                 var f_os = us.filter(dc.ous, function(o) {
//                     return o.company == String(d._id)
//                 })
//                 _.each(f_os, function(o) {
//                     if (!o.parent_ou) {
//                         var row = {
//                             'id': o._id,
//                             'pId': d._id,
//                             'name': o.ou_name,
//                             'type': 'o'
//                         };
//                         ret_data.push(row);
//                     } else {
//                         if (o.parent_ou.company == String(d._id)) {
//                             var row = {
//                                 'id': o._id,
//                                 'pId': o.parent_ou._id,
//                                 'name': o.ou_name,
//                                 'type': 'o'
//                             };
//                             ret_data.push(row);
//                         } else {
//                             var row = {
//                                 'id': o._id,
//                                 'pId': d._id,
//                                 'name': o.ou_name,
//                                 'type': 'o'
//                             };
//                             ret_data.push(row);
//                         }
//                     }
//                     var o_p = _.filter(dc.pos, function(p) {
//                         return !!~dc.pep.indexOf(String(p._id))
//                     })
//                     var f_ps = _.filter(o_p, function(p) {
//                         return p.belongto_ou._id == String(o._id)
//                     })
//                     _.each(f_ps, function(p) {
//                         if (p.position_manager) {
//                             if (!p.position_direct_superior) {
//                                 var row = {
//                                     'id': p._id,
//                                     'pId': o._id,
//                                     'name': sprintf('<span class="label label-info" style="padding:1px;">%s</span>', p.position_name),
//                                     'type': 'p'
//                                 };
//                                 ret_data.push(row);
//                             } else {
//                                 if (p.position_direct_superior.belongto_ou._id == String(o._id)) {
//                                     var row = {
//                                         'id': p._id,
//                                         'pId': p.position_direct_superior._id,
//                                         'name': sprintf('<span class="label label-info" style="padding:1px;">%s</span>', p.position_name),
//                                         'type': 'p'
//                                     };
//                                     ret_data.push(row);
//                                 } else {
//                                     var row = {
//                                         'id': p._id,
//                                         'pId': o._id,
//                                         'name': sprintf('<span class="label label-info" style="padding:1px;">%s</span>', p.position_name),
//                                         'type': 'p'
//                                     };
//                                     ret_data.push(row);
//                                 }
//                             }
//                         } else {
//                             if (!p.position_direct_superior) {
//                                 var row = {
//                                     'id': p._id,
//                                     'pId': o._id,
//                                     'name': p.position_name,
//                                     'type': 'p'
//                                 };
//                                 ret_data.push(row);
//                             } else {
//                                 if (p.position_direct_superior.belongto_ou._id == String(o._id)) {
//                                     var row = {
//                                         'id': p._id,
//                                         'pId': p.position_direct_superior._id,
//                                         'name': p.position_name,
//                                         'type': 'p'
//                                     };
//                                     ret_data.push(row);
//                                 } else {
//                                     var row = {
//                                         'id': p._id,
//                                         'pId': o._id,
//                                         'name': p.position_name,
//                                         'type': 'p'
//                                     };
//                                     ret_data.push(row);
//                                 }
//                             }
//                         }


//                     })
//                 })


//             })

//             cb(null, ret_data);
//         }
//     ], function(err, result) {
//         res.send(result);
//     })
// }
var people_get_data = function(req, res) {
    var client = req.user.client.id;
    // if (req.body.category == 'time') {
    //     var work_time = req.body.work_time;
    // } else {
    //     var work_calendar = req.body.work_calendar;
    // }
    var tm_work_plan = JSON.parse(req.body.tm_work_plan);
    var pps = JSON.parse(req.body.pps);
    var type = req.body.type;
    var msg = '配置成功！！';
    var msg_c = '配置失败！！';
    if (type == 'u') {
        msg = '修改成功！！';
        msg_c = '修改失败！！';
    };
    async.times(pps.length, function(n, next) {
        People.find({
            client: client,
            position: pps[n]
        }, function(err, result) {
            if (result) {
                async.times(result.length, function(n, next) {
                    var res = result[n];
                    // if (req.body.category == 'time') {
                    //     res.work_time = work_time;

                    // } else {
                    //     res.work_calendar = work_calendar;

                    // }
                    res.tm_work_plan = tm_work_plan;
                    res.save(next)
                }, next)
            } else {
                next(null, null)
            }
        })
    }, function(err, result) {
        if (err) {
            res.json({
                code: 'ERR',
                msg: msg_c
            })
        };
        if (result.length > 0) {
            res.json({
                code: 'OK',
                msg: msg
            })
        }
    })

}
var pep_time_calendar_edit = function(req, res) {
    var i18n = req.i18n;
    var client = req.user.client.id;
    var pep_id = req.params.pep_id;
    var render_data = {
        title: '人员工作时间-赋予',
        user: req.user,
        _: us,
        modi_type: 'edit',
        moment: moment
    };
    async.parallel({
        pep: function(cb) {
            People.findById(pep_id).populate('tm_work_plan').exec(cb)
        },
        // work_time: function(cb) {
        //     WorkTime.find({
        //         client: client
        //     }).exec(cb)
        // },
        // work_calendar: function(cb) {
        //     WorkCategory.find({
        //         client: client
        //     }).exec(cb)
        // }
    }, function(err, result) {
        render_data.pep_data = result.pep;
        // render_data.work_time = result.work_time;
        // render_data.work_calendar = result.work_calendar;
        res.render('admin/tm/cardrecord/edit', render_data);
    })
}
var pep_time_calendar_edit_save = function(req, res) {
    var i18n = req.i18n;
    var client = req.user.client.id;
    var pep_id = req.body.pep_id;
    var tm_work_plan = JSON.parse(req.body.tm_work_plan);
    People.findById(pep_id).exec(function(err, result) {
        if (err) {
            return res.status(500).json({
                code: 'ERR',
                msg: '内部服务器错误：' + err
            });
        };
        if (result) {
            result.tm_work_plan = tm_work_plan;
            result.save();
            return res.json({
                code: 'OK',
                msg: sprintf('数据保存成功！'),
            });
        } else {
            return res.status(500).json({
                code: 'ERR',
                msg: '数据保存失败'
            });
        };
    })
}
var pep_time_calendar_del = function(req, res) {
        var client = req.user.client.id;
        var pep_id = req.body.pep_id;
        People.findById(pep_id).exec(function(err, result) {
            if (err) {
                return res.json({
                    code: 'ERR',
                    msg: '内部服务器错误：' + err
                })
            }
            if (result) {
                result.tm_work_plan = null;
                result.save();
                return res.json({
                    code: 'OK',
                    msg: '数据删除成功！！！'
                })
            } else {
                return res.json({
                    code: 'OK',
                    msg: '数据删除失败！！！'
                })
            }
        })
    }
    //考勤配置-与薪酬挂钩的
var card_record_payroll_config = function(req, res) {
    var i18n = req.i18n;
    var client = req.user.client.id;
    var render_data = {
        title: '考勤处罚规则-配置',
        user: req.user,
        _: us,
        moment: moment
    };
    CardRecordPayroll.find({
        client: client
    }).populate('pri pris.pri').exec(function(err, result) {
        if (result.length > 0) {
            render_data.result = result[0];
            res.render('admin/tm/cardrecord/pay_config', render_data);
        } else {
            CardRecordPayroll.create({
                client: client
            }, function(err, data) {
                render_data.result = data;
                res.render('admin/tm/cardrecord/pay_config', render_data);
            })
        }

    })
}
var card_record_payroll_config_save = function(req, res) {
    var i18n = req.i18n;
    var client = req.user.client.id;
    var config_id = req.body.config_id;
    var pay_type = req.body.pay_type;
    var absence_data = JSON.parse(req.body.absence_data);
    var pris = JSON.parse(req.body.pris);
    var items = [];
    us.each(pris, function(pri) {
        var sg;
        if (pri.sign == '1') {
            sg = '+'
        } else if (pri.sign == '0') {
            sg = '-'
        }
        items.push({
            pri: pri.pri,
            sign: sg
        })
    })
    var no_card_record_day = req.body.no_card_record_day;
    var no_card_record_money = req.body.no_card_record_money;
    var pri = req.body.pri;
    if (pay_type == 'A') {
        var type_a_c_pay = req.body.type_a_c_pay;

    } else {
        var type_b = JSON.parse(req.body.type_b);
    };
    var update_data = {
        client: client,
        absence_data: absence_data,
        no_card_record_day: no_card_record_day,
        no_card_record_money: no_card_record_money,
        pri: pri || null,
        pay_type: pay_type,
        pris: items || null
    };
    if (pay_type == 'A') {
        update_data.type_a_c_pay = type_a_c_pay;
    } else {
        update_data.type_b = type_b;
    }
    CardRecordPayroll.findByIdAndUpdate(config_id, update_data, function(err, result) {
        if (err) {
            return res.json({
                code: 'ERR',
                msg: '内部服务器错误'
            })
        };
        if (result) {
            return res.json({
                code: 'OK',
                msg: '数据保存成功!!!'
            })
        }
    })
}
var card_record_payroll_config_del = function(req, res) {
    var client = req.user.client.id;
    var config_id = req.body.config_id;
    var type = req.body.type;
    if (type == 'a') {
        var absence_id = req.body.absence_id;

    } else {
        var type_b_id = req.body.type_b_id;
    }
    CardRecordPayroll.findById(config_id).exec(function(err, result) {
        if (err) {
            return res.json({
                code: 'ERR',
                msg: '内部服务器错误：' + err
            })
        }
        if (result) {
            if (type == 'a') {
                var absence_data = _.find(result.absence_data, function(data) {
                    return data._id != String(absence_id)
                });
                result.absence_data = absence_data;
            } else {
                var type_b = _.find(result.type_b, function(data) {
                    return data._id != String(type_b_id)
                });
                result.type_b = type_b;
            }

            result.save();
            return res.json({
                code: 'OK',
                msg: '数据删除成功！！！'
            })
        } else {
            return res.json({
                code: 'OK',
                msg: '数据删除失败！！！'
            })
        }
    })
};
var time_calendar_json_data = function(req, res) {
    var client = req.user.client.id;
    async.parallel({
        time: function(cb) {
            WorkTime.find({
                client: client
            }).exec(cb)
        },
        calendar: function(cb) {
            WorkCategory.find({
                client: client
            }).exec(cb)
        }
    }, function(err, result) {
        if (err) {
            return res.json({
                code: 'ERR',
                msg: '内部服务器错误'
            })
        }
        if (result) {
            return res.json({
                code: 'OK',
                time: result.time,
                calendar: result.calendar
            })
        }
    })
};
var record_json_data = function(req, res) {
    var client = req.user.client.id;
    var people = req.body.people;
    async.parallel({
        time: function(cb) {
            WorkTime.find({
                client: client
            }).exec(cb)
        },
        calendar: function(cb) {
            WorkCategory.find({
                client: client
            }).exec(cb)
        },
        work_plan: function(cb) {
            People.findById(people).populate('tm_work_plan').select('_id tm_work_plan').exec(cb)
        },
        pep_calendar: function(cb) {
            PeopleWorkCalendar.findOne({
                client: client,
                people: people
            }).exec(cb)
        }
    }, function(err, result) {
        if (err) {
            return res.json({
                code: 'ERR',
                msg: '内部服务器错误'
            })
        }
        if (result) {
            return res.json({
                code: 'OK',
                time: result.time,
                calendar: result.calendar,
                plan: result.work_plan.tm_work_plan,
                pep_calendar: result.pep_calendar ? result.pep_calendar : ''
            })
        }
    })
};
//for beat card view data
var record_json_data_v2 = function(req, res) {
    var client = req.user.client.id;
    var people = req.body.people;
    async.parallel({
        time: function(cb) {
            WorkTime.find({
                client: client
            }).exec(cb)
        },
        work_plan: function(cb) {
            People.findById(people).populate('tm_work_plan').select('_id tm_work_plan').exec(cb)
        },
        pep_calendar: function(cb) {
            PeopleWorkCalendar.findOne({
                client: client,
                people: people
            }).populate('calendar_data.work_time').exec(cb)
        }
    }, function(err, result) {
        if (err) {
            return res.json({
                code: 'ERR',
                msg: '内部服务器错误'
            })
        }
        if (result) {
            return res.json({
                code: 'OK',
                time: result.time,
                plan: result.work_plan.tm_work_plan,
                pep_calendar: result.pep_calendar ? result.pep_calendar : ''
            })
        }
    })
};
var pep_attendance = function(req, res) {
    var i18n = req.i18n;
    var client = req.user.client.id;

    var render_data = {
        title: '人员考勤规则-赋予',
        user: req.user,
        _: us,
        moment: moment
    };
    People.find({
        client: client,
        block: false,
        employee_status: {
            $ne: 'R'
        },
        company: {
            $in: req.user.companies
        }
    }).select('_id people_name position_name people_no company_name is_positive_attendance').exec(function(err, result) {
        render_data.pep_data = result;
        res.render('admin/tm/cardrecord/pep_attendance', render_data);

    })
};
var attend_rule = function(req, res) {
    var i18n = req.i18n;
    var client = req.user.client.id;
    var pep_id = req.params.pep_id;
    var render_data = {
        title: '人员考勤规则-赋予',
        user: req.user,
        _: us,
        modi_type: 'edit',
        moment: moment
    };
    async.parallel({
        pep: function(cb) {
            People.findById(pep_id).exec(cb)
        },
    }, function(err, result) {
        render_data.pep_data = result.pep;
        res.render('admin/tm/cardrecord/attend_rule', render_data);
    })
};
var attend_rule_save = function(req, res) {
    var i18n = req.i18n;
    var client = req.user.client.id;
    var pep_id = req.body.pep_id;
    var is_positive_attendance = req.body.is_positive_attendance;
    People.findById(pep_id).exec(function(err, result) {
        if (err) {
            return res.status(500).json({
                code: 'ERR',
                msg: '内部服务器错误：' + err
            });
        };
        if (result) {
            result.is_positive_attendance = is_positive_attendance;
            result.save();
            return res.json({
                code: 'OK',
                msg: sprintf('数据保存成功！'),
            });
        } else {
            return res.status(500).json({
                code: 'ERR',
                msg: '数据保存失败'
            });
        };
    })
};
var pep_attend_batch = function(req, res) {
    var i18n = req.i18n;
    var client = req.user.client.id;

    var render_data = {
        title: '人员考勤规则-赋予',
        user: req.user,
        _: us,
        moment: moment
    };
    res.render('admin/tm/cardrecord/attend_batch', render_data);
};
var attend_rule_position_help_json = function(req, res) {
    var client = req.user.client;
    var c_type = req.params.c_type;
    var cond = {
        client: client
    };
    if (c_type == 'c') {
        cond.is_positive_attendance = null;
    } else {
        cond.is_positive_attendance = {
            $ne: null
        }
    }
    async.waterfall([

        function(cb) {
            async.parallel({
                companys: function(cb) {
                    Company.find({
                        _id: {
                            $in: req.user.companies
                        },
                    }, cb);
                },
                ous: function(cb) {
                    OrganizationUnit.find({
                        client: client.id,
                        company: {
                            $in: req.user.companies
                        },
                    }).populate('parent_ou').exec(cb);
                },
                pos: function(cb) {
                    Position.find({
                        client: client.id,
                        company: {
                            $in: req.user.companies
                        },
                    }).populate('position_direct_superior belongto_ou').exec(cb);
                },
                pep: function(cb) {
                    People.find(cond).populate('position').select('position').exec(function(err, positions) {
                        if (positions.length > 0) {
                            var pps = [];
                            us.each(positions, function(s) {
                                if (s.position) {
                                    pps.push(String(s.position._id))

                                }
                            })
                            cb(null, pps)
                        } else {
                            cb(null, null)
                        }
                    })
                }
            }, cb);
        },
        function(dc, cb) {
            var ret_data = [];
            _.each(dc.companys, function(d) {
                var row = {
                    'id': d._id,
                    'pId': null,
                    'name': d.company_name,
                    'type': 'c'
                };
                ret_data.push(row);
                var f_os = us.filter(dc.ous, function(o) {
                    return o.company == String(d._id)
                })
                _.each(f_os, function(o) {
                    if (!o.parent_ou) {
                        var row = {
                            'id': o._id,
                            'pId': d._id,
                            'name': o.ou_name,
                            'type': 'o'
                        };
                        ret_data.push(row);
                    } else {
                        if (o.parent_ou.company == String(d._id)) {
                            var row = {
                                'id': o._id,
                                'pId': o.parent_ou._id,
                                'name': o.ou_name,
                                'type': 'o'
                            };
                            ret_data.push(row);
                        } else {
                            var row = {
                                'id': o._id,
                                'pId': d._id,
                                'name': o.ou_name,
                                'type': 'o'
                            };
                            ret_data.push(row);
                        }
                    }
                    var o_p = _.filter(dc.pos, function(p) {
                        return !!~dc.pep.indexOf(String(p._id))
                    })
                    var f_ps = _.filter(o_p, function(p) {
                        return p.belongto_ou._id == String(o._id)
                    })
                    _.each(f_ps, function(p) {
                        if (p.position_manager) {
                            if (!p.position_direct_superior) {
                                var row = {
                                    'id': p._id,
                                    'pId': o._id,
                                    'name': sprintf('<span class="label label-info" style="padding:1px;">%s</span>', p.position_name),
                                    'type': 'p'
                                };
                                ret_data.push(row);
                            } else {
                                if (p.position_direct_superior.belongto_ou._id == String(o._id)) {
                                    var row = {
                                        'id': p._id,
                                        'pId': p.position_direct_superior._id,
                                        'name': sprintf('<span class="label label-info" style="padding:1px;">%s</span>', p.position_name),
                                        'type': 'p'
                                    };
                                    ret_data.push(row);
                                } else {
                                    var row = {
                                        'id': p._id,
                                        'pId': o._id,
                                        'name': sprintf('<span class="label label-info" style="padding:1px;">%s</span>', p.position_name),
                                        'type': 'p'
                                    };
                                    ret_data.push(row);
                                }
                            }
                        } else {
                            if (!p.position_direct_superior) {
                                var row = {
                                    'id': p._id,
                                    'pId': o._id,
                                    'name': p.position_name,
                                    'type': 'p'
                                };
                                ret_data.push(row);
                            } else {
                                if (p.position_direct_superior.belongto_ou._id == String(o._id)) {
                                    var row = {
                                        'id': p._id,
                                        'pId': p.position_direct_superior._id,
                                        'name': p.position_name,
                                        'type': 'p'
                                    };
                                    ret_data.push(row);
                                } else {
                                    var row = {
                                        'id': p._id,
                                        'pId': o._id,
                                        'name': p.position_name,
                                        'type': 'p'
                                    };
                                    ret_data.push(row);
                                }
                            }
                        }


                    })
                })


            })

            cb(null, ret_data);
        }
    ], function(err, result) {
        res.send(result);
    })
};

var attend_rule_get_data = function(req, res) {
    var client = req.user.client.id;
    var is_positive_attendance = req.body.is_positive_attendance;
    var pps = JSON.parse(req.body.pps);
    var type = req.body.type;
    var msg = '配置成功！！';
    var msg_c = '配置失败！！';
    if (type == 'u') {
        msg = '修改成功！！';
        msg_c = '修改失败！！';
    };
    async.times(pps.length, function(n, next) {
        People.find({
            client: client,
            position: pps[n]
        }, function(err, result) {
            if (result) {
                async.times(result.length, function(n, next) {
                    var res = result[n];
                    res.is_positive_attendance = is_positive_attendance;
                    res.save(next)
                }, next)
            } else {
                next(null, null)
            }
        })
    }, function(err, result) {
        if (err) {
            res.json({
                code: 'ERR',
                msg: msg_c
            })
        };
        if (result.length > 0) {
            res.json({
                code: 'OK',
                msg: msg
            })
        }
    })

};
var pep_attend_rule_del = function(req, res) {
    var client = req.user.client.id;
    var pep_id = req.body.pep_id;
    People.findById(pep_id).exec(function(err, result) {
        if (err) {
            return res.json({
                code: 'ERR',
                msg: '内部服务器错误：' + err
            })
        }
        if (result) {
            result.is_positive_attendance = null;
            result.save();
            return res.json({
                code: 'OK',
                msg: '数据删除成功！！！'
            })
        } else {
            return res.json({
                code: 'OK',
                msg: '数据删除失败！！！'
            })
        }
    })
};

//考勤统计报表
var attend_report = function(req, res) {
    var i18n = req.i18n;
    var client = req.user.client.id;

    var render_data = {
        title: '考勤统计-报表',
        user: req.user,
        _: us,
        moment: moment
    };

    res.render('admin/tm/cardrecord/hr_report_list_v2', render_data);
};
//考勤报表JSON数据
var attend_report_json = function(req, res) {
    var client = req.user.client.id;
    var company = req.user.companies;
    var begin_date = req.body.begin_date || moment(new Date()).startOf('month');
    var end_date = req.body.end_date || moment(new Date()).endOf('month');
    var ou_arr = req.body.ou_arr || [];
    //step1:  判断正向考勤还是逆向考勤
    //step2:  工作计划--和查找时间做比较--取出工作日历 得到要上班的天数
    //step3:  取打卡记录  判断考勤结论
    if (begin_date && end_date) {
        AttendanceResult.find({
            client: client
        }).populate({
            path: 'people',
            select: '_id people_no people_name company ou ou_name company_name position_name'
        }).sort({
            'people_no': -1
        }).exec(function(err, result) {
            var tblData = [];
            var filter_data = _.filter(result, function(r) {
                return !!~company.indexOf(String(r.people.company))
            });
            if (ou_arr.length > 0) {
                filter_data = _.filter(filter_data, function(r) {
                    return !!~ou_arr.indexOf(String(r.people.ou))
                })
            }
            _.each(filter_data, function(x) {
                var row = [];
                row.push(x.people.people_no); //col  1
                row.push(x.people.people_name); //col 2
                // row.push(x.people.company_name);
                row.push(x.people.position_name); //col 3
                //操作
                // row.push(x.people.ou_name);
                var work_calendar_day = 0;
                var late_num = 0,
                    leave_num = 0,
                    no_card_c_num = 0,
                    no_card_l_num = 0,
                    absence_num = 0;
                var temp_data = _.filter(x.data, function(f) {
                    return (f.is_job_day || f.is_beyond_work) && format(f.job_date) <= format(moment(end_date)) && format(f.job_date) >= format(moment(begin_date))
                })

                function format(date) {
                    return moment(date).format('YYYYMMDD')
                }
                work_calendar_day += temp_data.length;
                //迟到
                var late = _.filter(temp_data, function(d) {
                    return !!~d.work_result.indexOf('L')
                });
                //早退
                var leave = _.filter(temp_data, function(d) {
                    return !!~d.work_result.indexOf('E')
                });
                //未打卡
                var no_card_c = _.filter(temp_data, function(d) {
                    return !!~d.work_result.indexOf('NCM')

                });
                //下班未打卡
                var no_card_l = _.filter(temp_data, function(d) {
                    return !!~d.work_result.indexOf('NCA')

                });
                //旷工
                var absence = _.filter(temp_data, function(d) {
                    return !!~d.work_result.indexOf('A')

                });
                //加班
                var beyond_work = _.filter(temp_data, function(d) {
                    return !!~d.work_result.indexOf('B')
                })
                late_num += late.length;
                leave_num += leave.length;
                no_card_c_num += no_card_c.length;
                no_card_l_num += no_card_l.length;
                absence_num += absence.length;

                row.push(work_calendar_day);
                row.push(late_num);
                //迟到分钟数
                var late_num = _.reduce(_.map(temp_data, function(d) {
                    return d.work_pay.late_time
                }), function(mem, num) {
                    return mem + num
                }, 0)
                row.push(Math.round(late_num));
                row.push(leave_num);
                //早退分钟数
                var leave_num = _.reduce(_.map(temp_data, function(d) {
                    return d.work_pay.leave_time
                }), function(mem, num) {
                    return mem + num
                }, 0)
                row.push(Math.round(leave_num));
                row.push(absence_num);
                // row.push(no_card_c_num + no_card_l_num);
                //加班小时数
                var beyond_work_num = _.reduce(_.map(temp_data, function(d) {
                    return d.work_pay.beyond_work
                }), function(mem, num) {
                    return mem + num
                }, 0)
                row.push(beyond_work_num);

                row.push(sprintf("<a class='btn btn-small' href='/admin/tm/cardrecord/hr_list_v2?pep_id=%s' target='_blank' title='人员考勤日志列表'><i class='icon-list'></i></a>", x.people._id));

                tblData.push(row);
            });
            tblData = _.sortBy(tblData, function(temp) {
                return temp.people_no
            })
            return res.json({
                code: 'OK',
                data: tblData
            })
        })
    } else {
        AttendanceResult.find({
            client: client
        }).populate({
            path: 'people',
            select: '_id people_no people_name company ou ou_name company_name position_name'
        }).sort({
            'people_no': 1
        }).exec(function(err, result) {
            var tblData = [];

            _.each(result, function(x) {
                var row = [];
                row.push(x.people.people_no); //col  1
                row.push(x.people.people_name); //col 2
                // row.push(x.people.company_name);
                row.push(x.people.position_name); //col 3
                //操作
                // row.push(x.people.ou_name);
                var work_calendar_day = 0;
                var late_num = 0,
                    leave_num = 0,
                    no_card_c_num = 0,
                    no_card_l_num = 0,
                    absence_num = 0;
                var temp_data = _.filter(x.data, function(f) {
                    return f.is_job_day
                })
                work_calendar_day += temp_data.length;
                //迟到
                var late = _.filter(temp_data, function(d) {
                    return !!~d.work_result.indexOf('L')
                });
                //早退
                var leave = _.filter(temp_data, function(d) {
                    return !!~d.work_result.indexOf('E')
                });
                //未打卡
                var no_card_c = _.filter(temp_data, function(d) {
                    return !!~d.work_result.indexOf('NCM')

                });
                //下班未打卡
                var no_card_l = _.filter(temp_data, function(d) {
                    return !!~d.work_result.indexOf('NCA')

                });
                //旷工
                var absence = _.filter(temp_data, function(d) {
                    return !!~d.work_result.indexOf('A')

                });
                late_num += late.length;
                leave_num += leave.length;
                no_card_c_num += no_card_c.length;
                no_card_l_num += no_card_l.length;
                absence_num += absence.length;

                row.push(work_calendar_day);
                row.push(late_num);
                row.push(leave_num);
                row.push(absence_num);
                row.push(no_card_c_num + no_card_l_num);
                row.push(sprintf("<a class='btn btn-small' href='/admin/tm/cardrecord/hr_list_v2?pep_id=%s' target='_blank' title='人员考勤日志列表'><i class='icon-list'></i></a>", x.people._id));

                tblData.push(row);
            });
            return res.json({
                code: 'OK',
                data: tblData
            })
        })

    }



};
//考勤统计Version2
var refresh_attend_data = function(req, res) {
    var client = req.user.client.id;
    async.waterfall([

            function(cb) {
                async.parallel({
                    pep: function(cb) {
                        People.find({
                            client: client,
                            block: false
                        }).populate('tm_work_plan').exec(cb)
                    },
                    time: function(cb) {
                        WorkTime.find({
                            client: client
                        }).exec(cb)
                    },
                    calendar: function(cb) {
                        WorkCategory.find({
                            client: client
                        }).exec(cb)
                    },
                    cardrecord: function(cb) {
                        CardRecord.find({
                            client: client
                        }).exec(cb)
                    },
                    attend_payroll: function(cb) { //考勤规则
                        CardRecordPayroll.find({
                            client: client
                        }).exec(cb)
                    }
                }, cb)
            },
            function(data, cb) {
                var peps = data.pep ? data.pep : '';
                var cardrecord = data.cardrecord ? data.cardrecord : '';
                var worktime = data.time ? data.time : '';
                var workcalendar = data.calendar ? data.calendar : '';
                var attend_payroll = data.attend_payroll ? data.attend_payroll : '';
                async.times(peps.length, function(n, next) {
                    var pep = peps[n];
                    //以人员的工作计划和是否正向考勤作为入口
                    //temp date
                    // var begin_date = moment(new Date()).subtract('months', 2),
                    //     end_date = new Date();

                    var tm_work_plan = pep.tm_work_plan ? pep.tm_work_plan : '';
                    var nation_holiday = pep.nation_holiday ? pep.nation_holiday : '';
                    if (tm_work_plan.length > 0) {
                        // var temp_work_plan =_.map(tm_work_plan,function(w){
                        //  return w._id;
                        // })
                        //遍历工作计划
                        async.times(tm_work_plan.length, function(n, next) {
                            //该人员的打卡记录
                            var expire_on = tm_work_plan[n].expire_on;
                            var expire_off = tm_work_plan[n].expire_off;
                            //工作时间
                            var single_work_time = _.find(worktime, function(temp) {
                                return String(tm_work_plan[n].work_time) == temp._id;
                            });
                            //工作日历
                            var single_work_calendar = _.find(workcalendar, function(temp) {
                                return String(tm_work_plan[n].work_calendar) == temp._id;
                            });
                            var cycle_period = _.map(single_work_calendar.cycle_period, function(week) {
                                return String(week.weekday);
                            });
                            //时间区间中的时间
                            var days_between = moment(expire_off).diff(moment(expire_on), 'days');
                            var days_arr = [];
                            for (var i = 0; i <= days_between; i++) {
                                var iterate_date = moment(expire_on).add('days', i);
                                days_arr.push(iterate_date);
                            };
                            //取出该人员当前工作计划内的正常上班日期
                            var work_calendar_real = _.filter(days_arr, function(temp) {
                                return !!~cycle_period.indexOf(String(moment(temp).days()))
                            });
                            //判断人员法定假日,如果在工作日历中,则不做打卡记录判断.如果不在工作日历中,不管它，如果有调休的,
                            //而工作日历中没有的，则放进工作日历中,至于是半天还是全天，放进数组中，下一步判断.
                            var temp_days_arr = _.map(work_calendar_real, function(temp) {
                                return moment(temp).format('YYYY-MM-DD');
                            });
                            var special_holiday_work = [],
                                temp_holiday = []; //存放不工作但在工作日历中的日期，不需判断打卡记录，考勤结论为CC，CL
                            var exchange_holiday = []; //存放调休日期(工作日历中没有的、但是需要工作的，需判断打卡记录)
                            if (nation_holiday.length > 0) {
                                _.each(nation_holiday, function(temp) {
                                    _.each(temp.holiday, function(h) {
                                        if (!!~temp_days_arr.indexOf(moment(h.date).format('YYYY-MM-DD'))) {
                                            var obj = {};
                                            obj = {
                                                date: h.date,
                                                pro: h.property
                                            };
                                            if (h.property == 'h') {
                                                obj.t_s = h.time_zone_s;
                                                obj.t_e = h.time_zone_e;
                                            };
                                            temp_holiday.push(h.date);
                                            if (h.is_exchange) {
                                                if (!~temp_days_arr.indexOf(String(moment(h.exchange_date).format('YYYY-MM-DD')))) {
                                                    obj.change_date = h.exchange_date;
                                                    exchange_holiday.push(h.exchange_date);
                                                }
                                            }
                                            special_holiday_work.push(obj);

                                        };

                                    })
                                });
                            }

                            var create_data = {
                                client: client,
                                people: pep._id,
                                work_plan: tm_work_plan[n]._id
                            };
                            var result_data = [];
                            //根据工作日历取打卡记录  --留几个接口(请假、调休、以及出差等)
                            if (pep.is_positive_attendance) { //正向考勤入口
                                var pep_card_record = _.find(cardrecord, function(temp) {
                                    return temp.people == String(pep._id)
                                });
                                //遍历正常工作日历
                                _.each(work_calendar_real, function(temp) { //if find 上班  or {1.查找假期、调休、出差等表 2.旷工}
                                    var obj = {} //考勤时间
                                    if (pep_card_record) {
                                        var card_record_day = _.find(pep_card_record.record_data, function(card) {
                                            return card.card_time == String(moment(temp).format('YYYY-MM-DD'));
                                        });
                                    };
                                    if (temp_holiday.length > 0) {
                                        var holiday_date = _.find(temp_holiday, function(h) {
                                            return String(moment(h).format('YYYY-MM-DD')) == String(moment(temp).format('YYYY-MM-DD'));
                                        })
                                    }

                                    obj.work_date = temp;
                                    obj.work_result = [];
                                    obj.work_pay = {};
                                    if (holiday_date) {
                                        var special_holiday_temp = _.find(special_holiday_work, function(h) {
                                            return String(moment(h.date).format('YYYY-MM-DD')) == String(moment(temp).format('YYYY-MM-DD'));
                                        });
                                        if (special_holiday_temp.pro == 'f') {
                                            obj.work_result.push('CC');
                                            obj.work_result.push('CL');
                                        } else {
                                            if (card_record_day) {
                                                //上班 一般是上午
                                                if (card_record_day.come_time) {
                                                    var come_time = moment(card_record_day.come_time).format("HH:mm:SS");
                                                    var work_on_time = special_holiday_temp.t_s; //上班时间
                                                    var indure_time_on = single_work_time.indure_time_on; //容差时长
                                                    //,休息之前 = 打卡时间-上班时间
                                                    if (moment.duration(come_time) - moment.duration(single_work_time.rest_start) < 0) {
                                                        var data = (moment.duration(come_time) - moment.duration(work_on_time)) / 60000;
                                                        //休息时间内= 休息时间开始-上班时间
                                                    } else if (moment.duration(come_time) >= moment.duration(single_work_time.rest_start) && moment.duration(come_time) <= moment.duration(single_work_time.rest_end)) {
                                                        var data = (moment.duration(single_work_time.rest_start) - moment.duration(work_on_time)) / 60000;
                                                    } else {
                                                        //休息之后才打上班卡  =打卡时间 - 上班时间-休息时间
                                                        var data = (moment.duration(come_time) - moment.duration(work_on_time) - (moment.duration(single_work_time.rest_end) - moment.duration(single_work_time.rest_start))) / 60000;
                                                    };
                                                    if (data < indure_time_on) {
                                                        obj.work_result.push('CC');
                                                    } else {
                                                        obj.work_result.push('L');
                                                        obj.work_pay.late_time = data; //迟到分钟数
                                                    }
                                                } else {
                                                    obj.work_result.push('NCM');
                                                    obj.work_pay.no_card_num += 1;
                                                };
                                                //下班
                                                if (card_record_day.leave_time) {
                                                    var leave_time = moment(card_record_day.leave_time).format("HH:mm:SS");
                                                    var work_off_time = special_holiday_temp.t_e; //上班时间
                                                    var indure_time_off = single_work_time.indure_time_off; //容差时长
                                                    //,休息之前 =打卡时间 - 下班时间+休息时间
                                                    if (moment.duration(leave_time) - moment.duration(single_work_time.rest_start) < 0) {
                                                        var data = (moment.duration(leave_time) - moment.duration(work_off_time) + (moment.duration(single_work_time.rest_end) - moment.duration(single_work_time.rest_start))) / 60000;
                                                        //休息时间内= 休息时间开始-下班时间
                                                    } else if (moment.duration(leave_time) >= moment.duration(single_work_time.rest_start) && moment.duration(leave_time) <= moment.duration(single_work_time.rest_end)) {
                                                        var data = (moment.duration(single_work_time.rest_end) - moment.duration(work_off_time)) / 60000;
                                                    } else {
                                                        //休息之后才打上班卡  =打卡时间 - 下班时间
                                                        var data = (moment.duration(leave_time) - moment.duration(work_off_time)) / 60000;
                                                    };
                                                    if (-data < indure_time_off) {
                                                        obj.work_result.push('CL');
                                                    } else {
                                                        obj.work_result.push('E');
                                                        obj.work_pay.leave_time = -data; //迟到分钟数
                                                    }
                                                } else {
                                                    obj.work_result.push('NCA');
                                                    obj.work_pay.no_card_num += 1;
                                                }
                                            } else {
                                                obj.work_result.push('A');
                                                obj.work_result.push('NCM');
                                                obj.work_result.push('NCA');
                                                // obj.work_pay.absence_num = 0.5; //旷工天数

                                            }
                                        };
                                    } else {
                                        //考勤结论['L':迟到  'E':早退 'NCM':上班未打卡 'NCA':下班未打卡 'A'旷工 'C':正常]
                                        if (card_record_day) {

                                            //上班
                                            if (card_record_day.come_time) {
                                                var come_time = moment(card_record_day.come_time).format("HH:mm:SS");
                                                var work_on_time = single_work_time.work_on_time; //上班时间
                                                var indure_time_on = single_work_time.indure_time_on; //容差时长
                                                //,休息之前 = 打卡时间-上班时间
                                                if (moment.duration(come_time) - moment.duration(single_work_time.rest_start) < 0) {
                                                    var data = (moment.duration(come_time) - moment.duration(work_on_time)) / 60000;
                                                    //休息时间内= 休息时间开始-上班时间
                                                } else if (moment.duration(come_time) >= moment.duration(single_work_time.rest_start) && moment.duration(come_time) <= moment.duration(single_work_time.rest_end)) {
                                                    var data = (moment.duration(single_work_time.rest_start) - moment.duration(work_on_time)) / 60000;
                                                } else {
                                                    //休息之后才打上班卡  =打卡时间 - 上班时间-休息时间
                                                    var data = (moment.duration(come_time) - moment.duration(work_on_time) - (moment.duration(single_work_time.rest_end) - moment.duration(single_work_time.rest_start))) / 60000;
                                                };
                                                if (data < indure_time_on) {
                                                    obj.work_result.push('CC');
                                                } else {
                                                    obj.work_result.push('L');
                                                    obj.work_pay.late_time = data; //迟到分钟数
                                                }
                                            } else {
                                                obj.work_result.push('NCM');
                                                obj.work_pay.no_card_num += 1;
                                            }
                                            //下班
                                            if (card_record_day.leave_time) {
                                                var leave_time = moment(card_record_day.leave_time).format("HH:mm:SS");
                                                var work_off_time = single_work_time.work_off_time; //上班时间
                                                var indure_time_off = single_work_time.indure_time_off; //容差时长
                                                //,休息之前 =打卡时间 - 下班时间+休息时间
                                                if (moment.duration(leave_time) - moment.duration(single_work_time.rest_start) < 0) {
                                                    var data = (moment.duration(leave_time) - moment.duration(work_off_time) + (moment.duration(single_work_time.rest_end) - moment.duration(single_work_time.rest_start))) / 60000;
                                                    //休息时间内= 休息时间开始-下班时间
                                                } else if (moment.duration(leave_time) >= moment.duration(single_work_time.rest_start) && moment.duration(leave_time) <= moment.duration(single_work_time.rest_end)) {
                                                    var data = (moment.duration(single_work_time.rest_end) - moment.duration(work_off_time)) / 60000;
                                                } else {
                                                    //休息之后才打上班卡  =打卡时间 - 下班时间
                                                    var data = (moment.duration(leave_time) - moment.duration(work_off_time)) / 60000;
                                                };
                                                if (-data < indure_time_off) {
                                                    obj.work_result.push('CL');
                                                } else {
                                                    obj.work_result.push('E');
                                                    obj.work_pay.leave_time = -data; //迟到分钟数
                                                }
                                            } else {
                                                obj.work_result.push('NCA');
                                                obj.work_pay.no_card_num += 1;
                                            }


                                        } else {
                                            obj.work_result.push('A');
                                            obj.work_result.push('NCM');
                                            obj.work_result.push('NCA');

                                            obj.work_pay.absence_num = 1;
                                        };

                                    };
                                    result_data.push(obj);
                                });
                                //遍历调休日期
                                // console.log(exchange_holiday);
                                _.each(exchange_holiday, function(temp) {
                                    var obj = {} //考勤时间
                                    if (pep_card_record) {
                                        var card_record_day = _.find(pep_card_record.record_data, function(card) {
                                            return card.card_time == String(moment(temp).format('YYYY-MM-DD'));
                                        });
                                    };
                                    obj.work_date = temp;
                                    obj.work_result = [];
                                    obj.work_pay = {};

                                    //判断是全天还是半天
                                    var if_full_day_data = _.find(special_holiday_work, function(h) {
                                        return String(moment(h.change_date).format('YYYY-MM-DD')) == String(moment(temp).format('YYYY-MM-DD'));
                                    });
                                    if (if_full_day_data.pro == 'f') {
                                        //考勤结论['L':迟到  'E':早退 'NCM':上班未打卡 'NCA':下班未打卡 'A'旷工 'C':正常]
                                        if (card_record_day) {

                                            //上班
                                            if (card_record_day.come_time) {
                                                var come_time = moment(card_record_day.come_time).format("HH:mm:SS");
                                                var work_on_time = single_work_time.work_on_time; //上班时间
                                                var indure_time_on = single_work_time.indure_time_on; //容差时长
                                                //,休息之前 = 打卡时间-上班时间
                                                if (moment.duration(come_time) - moment.duration(single_work_time.rest_start) < 0) {
                                                    var data = (moment.duration(come_time) - moment.duration(work_on_time)) / 60000;
                                                    //休息时间内= 休息时间开始-上班时间
                                                } else if (moment.duration(come_time) >= moment.duration(single_work_time.rest_start) && moment.duration(come_time) <= moment.duration(single_work_time.rest_end)) {
                                                    var data = (moment.duration(single_work_time.rest_start) - moment.duration(work_on_time)) / 60000;
                                                } else {
                                                    //休息之后才打上班卡  =打卡时间 - 上班时间-休息时间
                                                    var data = (moment.duration(come_time) - moment.duration(work_on_time) - (moment.duration(single_work_time.rest_end) - moment.duration(single_work_time.rest_start))) / 60000;
                                                };
                                                if (data < indure_time_on) {
                                                    obj.work_result.push('CC');
                                                } else {
                                                    obj.work_result.push('L');
                                                    obj.work_pay.late_time = data; //迟到分钟数
                                                }
                                            } else {
                                                obj.work_result.push('NCM');
                                                obj.work_pay.no_card_num += 1;
                                            }
                                            //下班
                                            if (card_record_day.leave_time) {
                                                var leave_time = moment(card_record_day.leave_time).format("HH:mm:SS");
                                                var work_off_time = single_work_time.work_off_time; //上班时间
                                                var indure_time_off = single_work_time.indure_time_off; //容差时长
                                                //,休息之前 =打卡时间 - 下班时间+休息时间
                                                if (moment.duration(leave_time) - moment.duration(single_work_time.rest_start) < 0) {
                                                    var data = (moment.duration(leave_time) - moment.duration(work_off_time) + (moment.duration(single_work_time.rest_end) - moment.duration(single_work_time.rest_start))) / 60000;
                                                    //休息时间内= 休息时间开始-下班时间
                                                } else if (moment.duration(leave_time) >= moment.duration(single_work_time.rest_start) && moment.duration(leave_time) <= moment.duration(single_work_time.rest_end)) {
                                                    var data = (moment.duration(single_work_time.rest_end) - moment.duration(work_off_time)) / 60000;
                                                } else {
                                                    //休息之后才打上班卡  =打卡时间 - 下班时间
                                                    var data = (moment.duration(leave_time) - moment.duration(work_off_time)) / 60000;
                                                };
                                                if (-data < indure_time_off) {
                                                    obj.work_result.push('CL');
                                                } else {
                                                    obj.work_result.push('E');
                                                    obj.work_pay.leave_time = -data; //迟到分钟数
                                                }
                                            } else {
                                                obj.work_result.push('NCA');
                                                obj.work_pay.no_card_num += 1;
                                            }


                                        } else {
                                            obj.work_result.push('A');
                                            obj.work_result.push('NCM');
                                            obj.work_result.push('NCA');

                                            obj.work_pay.absence_num = 1;
                                        };

                                    } else {
                                        if (card_record_day) {
                                            //上班 一般是上午
                                            if (card_record_day.come_time) {
                                                var come_time = moment(card_record_day.come_time).format("HH:mm:SS");
                                                var work_on_time = if_full_day_data.t_s; //上班时间
                                                var indure_time_on = single_work_time.indure_time_on; //容差时长
                                                //,休息之前 = 打卡时间-上班时间
                                                if (moment.duration(come_time) - moment.duration(single_work_time.rest_start) < 0) {
                                                    var data = (moment.duration(come_time) - moment.duration(work_on_time)) / 60000;
                                                    //休息时间内= 休息时间开始-上班时间
                                                } else if (moment.duration(come_time) >= moment.duration(single_work_time.rest_start) && moment.duration(come_time) <= moment.duration(single_work_time.rest_end)) {
                                                    var data = (moment.duration(single_work_time.rest_start) - moment.duration(work_on_time)) / 60000;
                                                } else {
                                                    //休息之后才打上班卡  =打卡时间 - 上班时间-休息时间
                                                    var data = (moment.duration(come_time) - moment.duration(work_on_time) - (moment.duration(single_work_time.rest_end) - moment.duration(single_work_time.rest_start))) / 60000;
                                                };
                                                if (data < indure_time_on) {
                                                    obj.work_result.push('CC');
                                                } else {
                                                    obj.work_result.push('L');
                                                    obj.work_pay.late_time = data; //迟到分钟数
                                                }
                                            } else {
                                                obj.work_result.push('NCM');
                                                obj.work_pay.no_card_num += 1;
                                            };
                                            //下班
                                            if (card_record_day.leave_time) {
                                                var leave_time = moment(card_record_day.leave_time).format("HH:mm:SS");
                                                var work_off_time = if_full_day_data.t_e; //上班时间
                                                var indure_time_off = single_work_time.indure_time_off; //容差时长
                                                //,休息之前 =打卡时间 - 下班时间+休息时间
                                                if (moment.duration(leave_time) - moment.duration(single_work_time.rest_start) < 0) {
                                                    var data = (moment.duration(leave_time) - moment.duration(work_off_time) + (moment.duration(single_work_time.rest_end) - moment.duration(single_work_time.rest_start))) / 60000;
                                                    //休息时间内= 休息时间开始-下班时间
                                                } else if (moment.duration(leave_time) >= moment.duration(single_work_time.rest_start) && moment.duration(leave_time) <= moment.duration(single_work_time.rest_end)) {
                                                    var data = (moment.duration(single_work_time.rest_end) - moment.duration(work_off_time)) / 60000;
                                                } else {
                                                    //休息之后才打上班卡  =打卡时间 - 下班时间
                                                    var data = (moment.duration(leave_time) - moment.duration(work_off_time)) / 60000;
                                                };
                                                if (-data < indure_time_off) {
                                                    obj.work_result.push('CL');
                                                } else {
                                                    obj.work_result.push('E');
                                                    obj.work_pay.leave_time = -data; //迟到分钟数
                                                }
                                            } else {
                                                obj.work_result.push('NCA');
                                                obj.work_pay.no_card_num += 1;
                                            }
                                        } else {
                                            obj.work_result.push('A');
                                            obj.work_result.push('NCM');
                                            obj.work_result.push('NCA');
                                            // obj.work_pay.absence_num = 0.5; //旷工天数

                                        }

                                    }
                                    result_data.push(obj);
                                })
                            } else { //逆向考勤入口
                                //遍历正常工作日历
                                _.each(work_calendar_real, function(temp) {
                                    var obj = {}; //考勤时间
                                    obj.work_date = temp;
                                    obj.work_result = [];
                                    obj.work_result.push('CC');
                                    obj.work_result.push('CL');
                                    result_data.push(obj);
                                });
                                //遍历调休日期
                            };
                            create_data.data = result_data;
                            AttendanceResult.findOne({
                                client: client,
                                people: pep._id,
                                work_plan: tm_work_plan[n]._id
                            }).exec(function(err, result) {
                                if (result) {
                                    result.data = result_data;
                                    result.people = pep._id;
                                    result.work_plan = tm_work_plan[n]._id;
                                    result.save(next)
                                } else {
                                    AttendanceResult.create(create_data, next)
                                }
                            })



                        }, next)

                    } else {
                        next(null, null)
                    }

                }, cb)

            }

        ],
        function(err, data) {
            return res.json({
                code: 'OK',
                msg: '数据更新成功!'
            })
        })
};
/*
step1:从人员可更改工作日历表中取数据
step2:取不到,则取人员表中取工作计划,工作计划的数据分为更改的和原生的(根据工作时间和工作日历，将考勤结论更新进考勤结果表中去)
*/
var refresh_attend_data_v2 = function(req, res) {
    var client = req.user.client.id;
    async.waterfall([

            function(cb) {
                async.parallel({
                    pep: function(cb) {
                        People.find({
                            client: client,
                            block: false
                        }).populate('tm_work_plan').select('_id people_no tm_work_plan is_positive_attendance which_sign_style').exec(cb)
                    },
                    time: function(cb) {
                        WorkTime.find({
                            client: client
                        }).exec(cb)
                    },
                    calendar: function(cb) {
                        WorkCategory.find({
                            client: client
                        }).exec(cb)
                    },
                    cardrecord: function(cb) {
                        CardRecord.find({
                            client: client
                        }).exec(cb)
                    },
                    attend_payroll: function(cb) { //考勤规则
                        CardRecordPayroll.find({
                            client: client
                        }).exec(cb)
                    },
                    //people_work_calendar
                    pep_wc: function(cb) {
                        PeopleWorkCalendar.find({
                            client: client
                        }).exec(cb)
                    },
                    wf_absence: function(cb) { //假期流程
                        TMLeaveOfAbsence.find({
                            client: client,
                            is_over: true
                        }).exec(cb)
                    },
                    wf_three: function(cb) { //三条流程(加班\差旅\外出公干)
                        TmAbsenceOfThree.find({
                            client: client,
                            is_over: true
                        }).exec(cb)
                    },
                    wf_change: function(cb) {
                        AttendanceResultChange.find({
                            client: client,
                            is_over: true
                        }).exec(cb)
                    },
                    beyond_work: function(cb) { //加班薪酬基数
                        BeyondWorkPayroll.find({
                            client: client
                        }).exec(cb)
                    },
                    sign_first: function(cb) {
                        SignStyleConfig.findOne({
                            client: client
                        }).exec(cb)
                    }


                }, cb)
            },
            function(data, cb) {
                var peps = data.pep ? data.pep : '';
                var cardrecord = data.cardrecord ? data.cardrecord : '';
                var worktime = data.time ? data.time : '';
                var workcalendar = data.calendar ? data.calendar : '';
                var attend_payroll = data.attend_payroll ? data.attend_payroll : '';
                var pep_wc = data.pep_wc ? data.pep_wc : '';
                var wf_absence = data.wf_absence ? data.wf_absence : '';
                var wf_three = data.wf_three ? data.wf_three : '';
                var wf_change = data.wf_change ? data.wf_change : '';

                var beyond_work = data.beyond_work ? data.beyond_work : '';
                var sign_first = data.sign_first ? data.sign_first : '';

                async.times(peps.length, function(n, next) {
                    var pep = peps[n];

                    //以人员的工作计划和是否正向考勤作为入口
                    //先从人员可更改工作日历表中找,找不到，取PEOPLE表中的工作计划，通过当前时间取工作计划，只取一个.
                    var pep_change_wc = _.find(pep_wc, function(temp) {
                        return temp.people == String(pep._id);
                    });
                    var pep_change_wc = _.find(pep_wc, function(temp) {
                        return temp.people == String(pep._id);
                    });
                    var temp_wf_three = _.filter(wf_three, function(temp) {
                        return temp.people == String(pep._id);
                    })
                    var temp_wf_absence = _.filter(wf_absence, function(temp) {
                        return temp.people == String(pep._id);
                    })
                    var temp_wf_change = _.filter(wf_change, function(temp) {
                        return temp.people == String(pep._id);
                    })
                    if (pep_change_wc) {
                        AttendanceResult.findOne({
                            client: client,
                            people: pep._id
                        }).exec(function(err, result) {
                            if (result) {
                                var result_data = get_result_data(pep, cardrecord, sign_first, pep_change_wc, worktime, temp_wf_three, temp_wf_three, temp_wf_change)
                                result.data = result_data;
                                result.save(next)
                            } else {
                                var create_data = {
                                    client: client,
                                    people: pep._id
                                };
                                var result_data = get_result_data(pep, cardrecord, sign_first, pep_change_wc, worktime, temp_wf_three, temp_wf_three, temp_wf_change)
                                create_data.data = [];
                                create_data.data = result_data;
                                // console.log(util.inspect(create_data, false, 5))
                                AttendanceResult.create(create_data, next);
                            }
                        })
                    } else {
                        var tm_work_plan = pep.tm_work_plan ? pep.tm_work_plan : '';
                        if (tm_work_plan.length > 0) {
                            var now = new Date();
                            //适用一个工作计划(可能的bug:操作当天不在工作计划时间内)
                            var filter_work_plan = _.find(tm_work_plan, function(temp) {
                                return moment(now).isBefore(moment(temp.expire_off)) && moment(now).isAfter(moment(temp.expire_on))
                            });
                            if (filter_work_plan) {
                                //取更改的工作计划或者取原工作计划
                                if (filter_work_plan.calendar_data.length > 0) {
                                    var result_data = get_result_data_work_plan(pep, cardrecord, sign_first, filter_work_plan.calendar_data, worktime, filter_work_plan, temp_wf_absence, temp_wf_three, temp_wf_change)
                                } else { //更据工作计划表来生成人员工作日历
                                    var expire_on = filter_work_plan.expire_on;
                                    var expire_off = filter_work_plan.expire_off;
                                    if (moment(now).isAfter(expire_on)) {
                                        expire_on = now;
                                    }

                                    if (moment(expire_off).diff(moment(expire_on), 'days') > 90) {
                                        expire_off = moment(expire_on).add('months', 3);
                                    }
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
                                    if (filter_work_plan.work_calendar.length == 1 && filter_work_plan.work_calendar[0].which_calendar == 'A') {
                                        var filter_calendar_data = _.find(calendar, function(temp) {
                                            return temp._id == String(filter_work_plan.work_calendar[0].calendar)
                                        })
                                        var cycle_period = _.map(filter_calendar_data.cycle_period, function(week) {
                                            return String(week.weekday);
                                        });
                                        var work_calendar_all = _.filter(days_arr, function(date) {
                                            return !!~cycle_period.indexOf(String(moment(date).days()))
                                        });
                                    } else {
                                        if (filter_work_plan.work_calendar.length == 2) {
                                            var work_calendar_odd, work_calendar_even;
                                            _.each(filter_work_plan.work_calendar, function(temp) {
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
                                    console.log(work_calendar_all.length);
                                    var work_time = filter_work_plan.work_time;
                                    var work_time_name = filter_work_plan.work_time_name;
                                    var calendar_data = [];
                                    _.each(days_arr, function(temp) {
                                        var bool = _.find(work_calendar_all, function(work) {
                                            return moment(temp).format('YYYY-MM-DD') == String(moment(work).format('YYYY-MM-DD'))
                                        });

                                        bool = bool ? true : false;
                                        calendar_data.push({
                                            work_plan: filter_work_plan._id,
                                            work_plan_name: filter_work_plan.plan_name,
                                            job_date: moment(temp).format('YYYY-MM-DD'),
                                            work_time_name: work_time_name,
                                            work_time: work_time,
                                            is_job_day: bool
                                        })
                                    })
                                    var result_data = get_result_data_work_plan(pep, cardrecord, sign_first, calendar_data, worktime, filter_work_plan, temp_wf_absence, temp_wf_three, temp_wf_change)

                                };
                                AttendanceResult.findOne({
                                    client: client,
                                    people: pep._id
                                }).exec(function(err, result) {
                                    if (result) {
                                        // console.log(result_data.length);
                                        result.data = result_data;
                                        result.save(next)
                                    } else {
                                        var create_data = {
                                            client: client,
                                            people: pep._id
                                        };
                                        create_data.data = result_data;
                                        AttendanceResult.create(create_data, next);
                                    }
                                });

                            } else {
                                next(null, null);
                            }

                        } else {
                            next(null, null)
                        }
                    }


                }, cb)

            }

        ],
        function(err, data) {
            if (err) {
                console.log(err);
            }
            return res.json({
                code: 'OK',
                msg: '数据更新成功!'
            })
        })
};

function get_result_data(pep, cardrecord, sign_first, pep_change_wc, worktime, wf_absence, wf_three, wf_change) {
    var result_data = [];
    var pep_card_record = _.find(cardrecord, function(temp) {
        return temp.people == String(pep._id)
    });

    //根据工作日历取打卡记录  --留几个接口(请假、调休、以及出差等)
    if (pep.is_positive_attendance) { //正向考勤入口
        //遍历正常工作日历
        _.each(pep_change_wc.calendar_data, function(temp) { //if find 上班  or {1.查找假期、调休、出差等表 2.旷工}
            //工作时间
            var single_work_time = _.find(worktime, function(w) {
                return String(temp.work_time) == w._id;
            });
            //*{//跑流程中的数据
            //加班、差旅、公干
            var filter_wf_beyond_work = _.filter(wf_three, function(wf) {
                    var if_equal = _.find(wf.data, function(w) {
                        return format(temp.job_date) == String(format(w.start_date)) && format(temp.job_date) == String(format(w.end_date))
                    })
                    return wf.absence_type == 'B' && if_equal

                })
                //差旅
            var filter_wf_work_travel = _.filter(wf_three, function(wf) {
                    var if_equal = _.find(wf.data, function(w) {
                        return format(temp.job_date) == String(format(w.start_date)) && format(temp.job_date) == String(format(w.end_date))
                    })
                    return wf.absence_type == 'W' && if_equal
                })
                //市区公干
            var filter_wf_work_city = _.filter(wf_three, function(wf) {
                    var if_equal = _.find(wf.data, function(w) {
                        return format(temp.job_date) == String(format(w.start_date)) && format(temp.job_date) == String(format(w.end_date))
                    })
                    return wf.absence_type == 'C' && if_equal


                })
                //请假
            var filter_wf_absence = _.filter(wf_absence, function(wf) {
                var if_equal = _.find(wf.data, function(w) {
                    return format(temp.job_date) == String(format(w.start_date)) && format(temp.job_date) == String(format(w.end_date))
                })
                return if_equal


            })
            var filter_wf_change = _.filter(wf_change, function(wf) {
                return format(temp.job_date) == String(format(wf.change_date))
            })

            //考勤异常
            //}*
            var obj = {} //考勤时间
            if (pep_card_record) {
                var pep_sign_style = pep.which_sign_style ? pep.which_sign_style : [];
                var temp_obj = {},
                    temp_arr = [];
                if (sign_first) {
                    _.each(sign_first.style_order, function(s) {
                        if (s) {
                            temp_obj[s.sign_style] = s.sign_order;

                        }
                    });
                }

                _.each(pep_sign_style, function(s) {
                    temp_arr.push(temp_obj[String(s)]);
                })
                temp_arr = _.sortBy(temp_arr, function(t) {
                    return t;
                });
                temp_arr.reverse();
                var card_record_day = null;
                var temp_pop_data = temp_arr.pop();
                if (temp_pop_data == '0') {
                    temp_pop_data == 'B'
                }
                sign_sort(temp_pop_data, sign_first, pep_card_record)

                function sign_sort(temp_pop_data, sign_first, pep_card_record) {
                    if (temp_pop_data == 'B') {
                        temp_pop_data = 0;
                    }
                    if (sign_first) {
                        var single_sign = _.find(sign_first.style_order, function(s) {
                            return s.sign_order == String(temp_pop_data)
                        });
                    }

                    var sign_rule = single_sign ? single_sign.sign_style : 'P';
                    card_record_day = _.find(pep_card_record.record_data, function(card) {
                        return card.which_sign_style == String(sign_rule) && card.card_time == String(moment(temp.job_date).format('YYYY-MM-DD')) && temp.is_job_day;
                    });
                    var temp_pop_data = temp_arr.pop();
                    if (temp_pop_data == '0') {
                        temp_pop_data == 'B'
                    }
                    if (!card_record_day && temp_pop_data) {
                        sign_sort(temp_pop_data, sign_first, pep_card_record)
                    }

                }


                // console.log(card_record_day);

            };

            obj.job_date = moment(temp.job_date).toDate();
            obj.work_time = temp.work_time;
            obj.work_time_name = temp.work_time_name;
            obj.work_plan_name = temp.work_plan_name;
            obj.work_plan = temp.work_plan;
            obj.is_job_day = temp.is_job_day;


            obj.work_result = [];
            obj.work_pay = {};

            //考勤结论['L':迟到  'E':早退 'NCM':上班未打卡 'NCA':下班未打卡 'A'旷工 'C':正常]
            if (card_record_day) {

                //上班
                if (card_record_day.come_time) {
                    var come_time = moment(card_record_day.come_time).format("HH:mm:SS");
                    var work_on_time = single_work_time.work_on_time; //上班时间
                    var indure_time_on = single_work_time.indure_time_on; //容差时长
                    //,休息之前 = 打卡时间-上班时间
                    if (moment.duration(come_time) - moment.duration(single_work_time.rest_start) < 0) {
                        var data = (moment.duration(come_time) - moment.duration(work_on_time)) / 60000;
                        //休息时间内= 休息时间开始-上班时间
                    } else if (moment.duration(come_time) >= moment.duration(single_work_time.rest_start) && moment.duration(come_time) <= moment.duration(single_work_time.rest_end)) {
                        var data = (moment.duration(single_work_time.rest_start) - moment.duration(work_on_time)) / 60000;
                    } else {
                        //休息之后才打上班卡  =打卡时间 - 上班时间-休息时间
                        var data = (moment.duration(come_time) - moment.duration(work_on_time) - (moment.duration(single_work_time.rest_end) - moment.duration(single_work_time.rest_start))) / 60000;
                    };
                    if (data < indure_time_on) {
                        obj.work_result.push('CC');
                    } else {
                        obj.work_result.push('L');
                        obj.work_pay.late_time = data ? data : 0; //迟到分钟数
                    }
                } else {
                    obj.work_result.push('NCM');
                    obj.work_pay.no_card_num = 0
                    obj.work_pay.no_card_num += 1;
                }
                //下班
                if (card_record_day.leave_time) {
                    var leave_time = moment(card_record_day.leave_time).format("HH:mm:SS");
                    var work_off_time = single_work_time.work_off_time; //上班时间
                    var indure_time_off = single_work_time.indure_time_off; //容差时长
                    //,休息之前 =打卡时间 - 下班时间+休息时间
                    if (moment.duration(leave_time) - moment.duration(single_work_time.rest_start) < 0) {
                        var data = (moment.duration(leave_time) - moment.duration(work_off_time) + (moment.duration(single_work_time.rest_end) - moment.duration(single_work_time.rest_start))) / 60000;
                        //休息时间内= 休息时间开始-下班时间
                    } else if (moment.duration(leave_time) >= moment.duration(single_work_time.rest_start) && moment.duration(leave_time) <= moment.duration(single_work_time.rest_end)) {
                        var data = (moment.duration(single_work_time.rest_end) - moment.duration(work_off_time)) / 60000;
                    } else {
                        //休息之后才打上班卡  =打卡时间 - 下班时间
                        var data = (moment.duration(leave_time) - moment.duration(work_off_time)) / 60000;
                    };
                    if (-data < indure_time_off) {
                        obj.work_result.push('CL');
                    } else {
                        obj.work_result.push('E');
                        obj.work_pay.leave_time = -data ? -data : 0; //迟到分钟数
                    }
                } else {
                    obj.work_result.push('NCA');
                    obj.work_pay.no_card_num = 0
                    obj.work_pay.no_card_num += 1;
                }


            } else {
                obj.work_result.push('A');
                obj.work_result.push('NCM');
                obj.work_result.push('NCA');

                obj.work_pay.absence_num = 1;
            };
            if (filter_wf_beyond_work.length > 0) {

                var single_data = _.find(filter_wf_beyond_work[0].data, function(w) {
                    return format(w.start_date) == String(format(temp.job_date))
                })
                if (single_data) {
                    obj.work_result.push('B');
                    if (!~obj.work_result.indexOf('CC')) {
                        obj.work_result.push('CC');

                    }
                    if (!~obj.work_result.indexOf('CL')) {
                        obj.work_result.push('CL');

                    }
                    if (single_data.is_full_day) { //移除迟到，早退和旷工的
                        if (!!~obj.work_result.indexOf('L')) {
                            var index = obj.work_result.indexOf('L');
                            obj.work_result.splice(index, 1);
                            obj.work_pay.late_time = 0;

                        }
                        if (!!~obj.work_result.indexOf('E')) {
                            var index = obj.work_result.indexOf('E');
                            obj.work_result.splice(index, 1);
                            obj.work_pay.leave_time = 0;
                        }
                        if (!!~obj.work_result.indexOf('A')) {
                            var index = obj.work_result.indexOf('A');
                            obj.work_result.splice(index, 1);
                            obj.work_pay.absence_num = 0;
                        }

                    }
                    obj.work_pay.beyond_work = single_data.total_time;
                    obj.work_pay.is_exchange = filter_wf_beyond_work[0].is_exchange;
                    obj.work_pay.category = filter_wf_beyond_work[0].category ? filter_wf_beyond_work[0].category : '1';
                }
            }
            if (filter_wf_work_city.length > 0) {
                var single_data = _.find(filter_wf_work_city[0].data, function(w) {
                    return format(w.start_date) == String(format(temp.job_date))
                })
                if (single_data) {
                    obj.is_beyond_work = true;
                    obj.work_result.push('C');
                    if (!~obj.work_result.indexOf('CC')) {
                        obj.work_result.push('CC');

                    }
                    if (!~obj.work_result.indexOf('CL')) {
                        obj.work_result.push('CL');

                    }
                    if (single_data.is_full_day) { //移除迟到，早退和旷工的
                        if (!!~obj.work_result.indexOf('L')) {
                            var index = obj.work_result.indexOf('L');
                            obj.work_result.splice(index, 1);
                            obj.work_pay.late_time = 0;

                        }
                        if (!!~obj.work_result.indexOf('E')) {
                            var index = obj.work_result.indexOf('E');
                            obj.work_result.splice(index, 1);
                            obj.work_pay.leave_time = 0;
                        }
                        if (!!~obj.work_result.indexOf('A')) {
                            var index = obj.work_result.indexOf('A');
                            obj.work_result.splice(index, 1);
                            obj.work_pay.absence_num = 0;
                        }

                    } else {
                        if (single_data.time_zone_s == String(single_data.work_on_time)) {
                            if (!~obj.work_result.indexOf('CC')) {
                                obj.work_result.push('CC');

                            }

                        }
                        if (single_data.time_zone_e == String(single_data.work_off_time)) {
                            if (!~obj.work_result.indexOf('CL')) {
                                obj.work_result.push('CL');

                            }

                        }

                    }
                }
            }
            if (filter_wf_work_travel.length > 0) {
                var single_data = _.find(filter_wf_work_travel[0].data, function(w) {
                    return format(w.start_date) == String(format(temp.job_date))
                })
                if (single_data) {
                    obj.is_beyond_work = true;
                    obj.work_result.push('W');
                    if (!~obj.work_result.indexOf('CC')) {
                        obj.work_result.push('CC');

                    }
                    if (!~obj.work_result.indexOf('CL')) {
                        obj.work_result.push('CL');

                    }
                    if (single_data.is_full_day) { //移除迟到，早退和旷工的
                        if (!!~obj.work_result.indexOf('L')) {
                            var index = obj.work_result.indexOf('L');
                            obj.work_result.splice(index, 1);
                            obj.work_pay.late_time = 0;

                        }
                        if (!!~obj.work_result.indexOf('E')) {
                            var index = obj.work_result.indexOf('E');
                            obj.work_result.splice(index, 1);
                            obj.work_pay.leave_time = 0;
                        }
                        if (!!~obj.work_result.indexOf('A')) {
                            var index = obj.work_result.indexOf('A');
                            obj.work_result.splice(index, 1);
                            obj.work_pay.absence_num = 0;
                        }

                    }
                }
            }
            if (filter_wf_absence.length > 0) {
                var single_data = _.find(filter_wf_absence[0].data, function(w) {
                    return format(w.start_date) == String(format(temp.job_date))
                })
                if (single_data) {
                    obj.is_beyond_work = true;
                    obj.work_result.push('H');
                    if (!~obj.work_result.indexOf('CC')) {
                        obj.work_result.push('CC');

                    }
                    if (!~obj.work_result.indexOf('CL')) {
                        obj.work_result.push('CL');

                    }
                    if (single_data.is_full_day) { //移除迟到，早退和旷工的
                        if (!!~obj.work_result.indexOf('L')) {
                            var index = obj.work_result.indexOf('L');
                            obj.work_result.splice(index, 1);
                            obj.work_pay.late_time = 0;

                        }
                        if (!!~obj.work_result.indexOf('E')) {
                            var index = obj.work_result.indexOf('E');
                            obj.work_result.splice(index, 1);
                            obj.work_pay.leave_time = 0;
                        }
                        if (!!~obj.work_result.indexOf('A')) {
                            var index = obj.work_result.indexOf('A');
                            obj.work_result.splice(index, 1);
                            obj.work_pay.absence_num = 0;
                        }

                    }
                }
            }
            if (filter_wf_change.length > 0) {
                var single_data = _.find(filter_wf_change, function(w) {
                    return format(w.change_date) == String(format(temp.job_date))
                })

                if (single_data) {
                    obj.work_result.push('I');
                }
            }


            result_data.push(obj);
        });

    } else { //逆向考勤入口
        //遍历正常工作日历
        _.each(pep_change_wc.calendar_data, function(temp) {
            //工作时间
            var single_work_time = _.find(worktime, function(w) {
                return String(temp.work_time) == w._id;
            });
            //*{//跑流程中的数据
            //加班、差旅、公干
            var filter_wf_beyond_work = _.filter(wf_three, function(wf) {
                    var if_equal = _.find(wf.data, function(w) {
                        return format(temp.job_date) == String(format(w.start_date)) && format(temp.job_date) == String(format(w.end_date))
                    })
                    return wf.absence_type == 'B' && if_equal

                })
                //差旅
            var filter_wf_work_travel = _.filter(wf_three, function(wf) {
                    var if_equal = _.find(wf.data, function(w) {
                        return format(temp.job_date) == String(format(w.start_date)) && format(temp.job_date) == String(format(w.end_date))
                    })
                    return wf.absence_type == 'W' && if_equal
                })
                //市区公干
            var filter_wf_work_city = _.filter(wf_three, function(wf) {
                    var if_equal = _.find(wf.data, function(w) {
                        return format(temp.job_date) == String(format(w.start_date)) && format(temp.job_date) == String(format(w.end_date))
                    })
                    return wf.absence_type == 'C' && if_equal


                })
                //请假
            var filter_wf_absence = _.filter(wf_absence, function(wf) {
                var if_equal = _.find(wf.data, function(w) {
                    return format(temp.job_date) == String(format(w.start_date)) && format(temp.job_date) == String(format(w.end_date))
                })
                return if_equal


            })
            var filter_wf_change = _.filter(wf_change, function(wf) {
                return format(temp.job_date) == String(format(wf.change_date))
            })

            //}*
            var obj = {} //考勤时间
            if (pep_card_record) {
                var pep_sign_style = pep.which_sign_style ? pep.which_sign_style : [];
                var temp_obj = {},
                    temp_arr = [];
                if (sign_first) {
                    _.each(sign_first.style_order, function(s) {
                        if (s) {
                            temp_obj[s.sign_style] = s.sign_order;

                        }
                    });
                }

                _.each(pep_sign_style, function(s) {
                    temp_arr.push(temp_obj[String(s)]);
                })
                temp_arr = _.sortBy(temp_arr, function(t) {
                    return t;
                });
                temp_arr.reverse();
                var card_record_day = null;
                var temp_pop_data = temp_arr.pop();
                if (temp_pop_data == '0') {
                    temp_pop_data == 'B'
                }
                sign_sort(temp_pop_data, sign_first, pep_card_record)

                function sign_sort(temp_pop_data, sign_first, pep_card_record) {
                    if (temp_pop_data == 'B') {
                        temp_pop_data = 0;
                    }
                    if (sign_first) {
                        var single_sign = _.find(sign_first.style_order, function(s) {
                            return s.sign_order == String(temp_pop_data)
                        });
                    }

                    var sign_rule = single_sign ? single_sign.sign_style : 'P';
                    card_record_day = _.find(pep_card_record.record_data, function(card) {
                        return card.which_sign_style == String(sign_rule) && card.card_time == String(moment(temp.job_date).format('YYYY-MM-DD')) && temp.is_job_day;
                    });
                    var temp_pop_data = temp_arr.pop();
                    if (temp_pop_data == '0') {
                        temp_pop_data == 'B'
                    }
                    if (!card_record_day && temp_pop_data) {
                        sign_sort(temp_pop_data, sign_first, pep_card_record)
                    }

                }


                // console.log(card_record_day);

            };

            obj.job_date = temp.job_date;
            obj.work_time = temp.work_time;
            obj.work_time_name = temp.work_time_name;
            obj.work_plan_name = temp.work_plan_name;
            obj.work_plan = temp.work_plan;
            obj.is_job_day = temp.is_job_day;

            obj.work_result = [];
            obj.work_pay = {};
            if (card_record_day) {
                //上班
                if (card_record_day.come_time) {
                    obj.work_result.push('CC');
                } else {
                    obj.work_result.push('NCM');
                    obj.work_result.push('CC');

                    obj.work_pay.no_card_num = 0;
                }
                //下班
                if (card_record_day.leave_time) {
                    obj.work_result.push('CL');
                } else {
                    obj.work_result.push('NCA');
                    obj.work_result.push('CL');
                    obj.work_pay.no_card_num = 0;
                }
            } else {
                obj.work_result.push('NCM');
                obj.work_result.push('NCA');
                obj.work_result.push('CC');
                obj.work_result.push('CL');

                obj.work_pay.absence_num = 0;
            };
            if (filter_wf_beyond_work.length > 0) {

                var single_data = _.find(filter_wf_beyond_work[0].data, function(w) {
                    return format(w.start_date) == String(format(temp.job_date))
                })
                if (single_data) {
                    obj.work_result.push('B');
                    if (!~obj.work_result.indexOf('CC')) {
                        obj.work_result.push('CC');

                    }
                    if (!~obj.work_result.indexOf('CL')) {
                        obj.work_result.push('CL');

                    }
                    if (single_data.is_full_day) { //移除迟到，早退和旷工的
                        if (!!~obj.work_result.indexOf('L')) {
                            var index = obj.work_result.indexOf('L');
                            obj.work_result.splice(index, 1);
                            obj.work_pay.late_time = 0;

                        }
                        if (!!~obj.work_result.indexOf('E')) {
                            var index = obj.work_result.indexOf('E');
                            obj.work_result.splice(index, 1);
                            obj.work_pay.leave_time = 0;
                        }
                        if (!!~obj.work_result.indexOf('A')) {
                            var index = obj.work_result.indexOf('A');
                            obj.work_result.splice(index, 1);
                            obj.work_pay.absence_num = 0;
                        }

                    }
                    obj.work_pay.beyond_work = single_data.total_time;
                    obj.work_pay.is_exchange = filter_wf_beyond_work[0].is_exchange;
                    obj.work_pay.category = filter_wf_beyond_work[0].category ? filter_wf_beyond_work[0].category : '1';
                }
            }
            if (filter_wf_work_city.length > 0) {
                var single_data = _.find(filter_wf_work_city[0].data, function(w) {
                    return format(w.start_date) == String(format(temp.job_date))
                })
                if (single_data) {
                    obj.is_beyond_work = true;
                    obj.work_result.push('C');
                    if (!~obj.work_result.indexOf('CC')) {
                        obj.work_result.push('CC');

                    }
                    if (!~obj.work_result.indexOf('CL')) {
                        obj.work_result.push('CL');

                    }
                    if (single_data.is_full_day) { //移除迟到，早退和旷工的
                        if (!!~obj.work_result.indexOf('L')) {
                            var index = obj.work_result.indexOf('L');
                            obj.work_result.splice(index, 1);
                            obj.work_pay.late_time = 0;

                        }
                        if (!!~obj.work_result.indexOf('E')) {
                            var index = obj.work_result.indexOf('E');
                            obj.work_result.splice(index, 1);
                            obj.work_pay.leave_time = 0;
                        }
                        if (!!~obj.work_result.indexOf('A')) {
                            var index = obj.work_result.indexOf('A');
                            obj.work_result.splice(index, 1);
                            obj.work_pay.absence_num = 0;
                        }

                    } else {
                        if (single_data.time_zone_s == String(single_data.work_on_time)) {
                            if (!~obj.work_result.indexOf('CC')) {
                                obj.work_result.push('CC');

                            }

                        }
                        if (single_data.time_zone_e == String(single_data.work_off_time)) {
                            if (!~obj.work_result.indexOf('CL')) {
                                obj.work_result.push('CL');

                            }

                        }

                    }
                }
            }

            if (filter_wf_work_travel.length > 0) {
                var single_data = _.find(filter_wf_work_travel[0].data, function(w) {
                    return format(w.start_date) == String(format(temp.job_date))
                })
                if (single_data) {
                    obj.is_beyond_work = true;
                    obj.work_result.push('W');
                    if (!~obj.work_result.indexOf('CC')) {
                        obj.work_result.push('CC');

                    }
                    if (!~obj.work_result.indexOf('CL')) {
                        obj.work_result.push('CL');

                    }
                    if (single_data.is_full_day) { //移除迟到，早退和旷工的
                        if (!!~obj.work_result.indexOf('L')) {
                            var index = obj.work_result.indexOf('L');
                            obj.work_result.splice(index, 1);
                            obj.work_pay.late_time = 0;

                        }
                        if (!!~obj.work_result.indexOf('E')) {
                            var index = obj.work_result.indexOf('E');
                            obj.work_result.splice(index, 1);
                            obj.work_pay.leave_time = 0;
                        }
                        if (!!~obj.work_result.indexOf('A')) {
                            var index = obj.work_result.indexOf('A');
                            obj.work_result.splice(index, 1);
                            obj.work_pay.absence_num = 0;
                        }

                    }
                }
            }
            if (filter_wf_absence.length > 0) {
                var single_data = _.find(filter_wf_absence[0].data, function(w) {
                    return format(w.start_date) == String(format(temp.job_date))
                })
                if (single_data) {
                    obj.is_beyond_work = true;
                    obj.work_result.push('H');
                    if (!~obj.work_result.indexOf('CC')) {
                        obj.work_result.push('CC');

                    }
                    if (!~obj.work_result.indexOf('CL')) {
                        obj.work_result.push('CL');

                    }
                    if (single_data.is_full_day) { //移除迟到，早退和旷工的
                        if (!!~obj.work_result.indexOf('L')) {
                            var index = obj.work_result.indexOf('L');
                            obj.work_result.splice(index, 1);
                            obj.work_pay.late_time = 0;

                        }
                        if (!!~obj.work_result.indexOf('E')) {
                            var index = obj.work_result.indexOf('E');
                            obj.work_result.splice(index, 1);
                            obj.work_pay.leave_time = 0;
                        }
                        if (!!~obj.work_result.indexOf('A')) {
                            var index = obj.work_result.indexOf('A');
                            obj.work_result.splice(index, 1);
                            obj.work_pay.absence_num = 0;
                        }

                    }
                }
            }
            if (filter_wf_change.length > 0) {
                var single_data = _.find(filter_wf_change, function(w) {
                    return format(w.change_date) == String(format(temp.job_date))
                })

                if (single_data) {
                    obj.work_result.push('I');
                }
            }

            result_data.push(obj);

        })

        //遍历调休日期
    };
    return result_data;
}

function get_result_data_work_plan(pep, cardrecord, sign_first, change_work_plan_cd, worktime, single_work_plan, wf_absence, wf_three, wf_change) {
    var result_data = [];
    var pep_card_record = _.find(cardrecord, function(temp) {
        return temp.people == String(pep._id)
    });
    //根据工作日历取打卡记录  --留几个接口(请假、调休、以及出差等)
    if (pep.is_positive_attendance) { //正向考勤入口
        //遍历正常工作日历
        _.each(change_work_plan_cd, function(temp) { //if find 上班  or {1.查找假期、调休、出差等表 2.旷工}
            //工作时间
            var single_work_time = _.find(worktime, function(w) {
                return String(temp.work_time) == w._id;
            });
            //*{//跑流程中的数据
            //加班、差旅、公干
            var filter_wf_beyond_work = _.filter(wf_three, function(wf) {
                    var if_equal = _.find(wf.data, function(w) {
                        return format(temp.job_date) == String(format(w.start_date)) && format(temp.job_date) == String(format(w.end_date))
                    })
                    return wf.absence_type == 'B' && if_equal

                })
                //差旅
            var filter_wf_work_travel = _.filter(wf_three, function(wf) {
                    var if_equal = _.find(wf.data, function(w) {
                        return format(temp.job_date) == String(format(w.start_date)) && format(temp.job_date) == String(format(w.end_date))
                    })
                    return wf.absence_type == 'W' && if_equal
                })
                //市区公干
            var filter_wf_work_city = _.filter(wf_three, function(wf) {
                    var if_equal = _.find(wf.data, function(w) {
                        return format(temp.job_date) == String(format(w.start_date)) && format(temp.job_date) == String(format(w.end_date))
                    })
                    return wf.absence_type == 'C' && if_equal


                })
                //请假
            var filter_wf_absence = _.filter(wf_absence, function(wf) {
                var if_equal = _.find(wf.data, function(w) {
                    return format(temp.job_date) == String(format(w.start_date)) && format(temp.job_date) == String(format(w.end_date))
                })
                return if_equal


            })
            var filter_wf_change = _.filter(wf_change, function(wf) {

                return format(temp.job_date) == String(format(wf.change_date))

            })

            //}*
            var obj = {} //考勤时间
            if (pep_card_record) {
                var pep_sign_style = pep.which_sign_style ? pep.which_sign_style : [];
                var temp_obj = {},
                    temp_arr = [];
                if (sign_first) {
                    _.each(sign_first.style_order, function(s) {
                        if (s) {
                            temp_obj[s.sign_style] = s.sign_order;

                        }
                    });
                }

                _.each(pep_sign_style, function(s) {
                    temp_arr.push(temp_obj[String(s)]);
                })
                temp_arr = _.sortBy(temp_arr, function(t) {
                    return t;
                });
                temp_arr.reverse();
                var card_record_day = null;
                var temp_pop_data = temp_arr.pop();
                if (temp_pop_data == '0') {
                    temp_pop_data == 'B'
                }
                sign_sort(temp_pop_data, sign_first, pep_card_record)

                function sign_sort(temp_pop_data, sign_first, pep_card_record) {
                    if (temp_pop_data == 'B') {
                        temp_pop_data = 0;
                    }
                    if (sign_first) {
                        var single_sign = _.find(sign_first.style_order, function(s) {
                            return s.sign_order == String(temp_pop_data)
                        });
                    }

                    var sign_rule = single_sign ? single_sign.sign_style : 'P';
                    card_record_day = _.find(pep_card_record.record_data, function(card) {
                        return card.which_sign_style == String(sign_rule) && card.card_time == String(moment(temp.job_date).format('YYYY-MM-DD')) && temp.is_job_day;
                    });
                    var temp_pop_data = temp_arr.pop();
                    if (temp_pop_data == '0') {
                        temp_pop_data == 'B'
                    }
                    if (!card_record_day && temp_pop_data) {
                        sign_sort(temp_pop_data, sign_first, pep_card_record)
                    }

                }


                // console.log(card_record_day);

            };


            obj.job_date = temp.job_date;
            obj.work_time = temp.work_time;
            obj.work_time_name = temp.work_time_name;
            obj.work_plan_name = single_work_plan.plan_name;
            obj.work_plan = single_work_plan._id;
            obj.is_job_day = temp.is_job_day;


            obj.work_result = [];
            obj.work_pay = {};

            //考勤结论['L':迟到  'E':早退 'NCM':上班未打卡 'NCA':下班未打卡 'A'旷工 'C':正常]
            if (card_record_day) {

                //上班
                if (card_record_day.come_time) {
                    var come_time = moment(card_record_day.come_time).format("HH:mm:SS");
                    var work_on_time = single_work_time.work_on_time; //上班时间
                    var indure_time_on = single_work_time.indure_time_on; //容差时长
                    //,休息之前 = 打卡时间-上班时间
                    if (moment.duration(come_time) - moment.duration(single_work_time.rest_start) < 0) {
                        var data = (moment.duration(come_time) - moment.duration(work_on_time)) / 60000;
                        //休息时间内= 休息时间开始-上班时间
                    } else if (moment.duration(come_time) >= moment.duration(single_work_time.rest_start) && moment.duration(come_time) <= moment.duration(single_work_time.rest_end)) {
                        var data = (moment.duration(single_work_time.rest_start) - moment.duration(work_on_time)) / 60000;
                    } else {
                        //休息之后才打上班卡  =打卡时间 - 上班时间-休息时间
                        var data = (moment.duration(come_time) - moment.duration(work_on_time) - (moment.duration(single_work_time.rest_end) - moment.duration(single_work_time.rest_start))) / 60000;
                    };
                    if (data < indure_time_on) {
                        obj.work_result.push('CC');
                    } else {
                        obj.work_result.push('L');
                        obj.work_pay.late_time = data; //迟到分钟数
                    }
                } else {
                    obj.work_result.push('NCM');
                    obj.work_pay.no_card_num = 0

                    obj.work_pay.no_card_num += 1;
                }
                //下班
                if (card_record_day.leave_time) {
                    var leave_time = moment(card_record_day.leave_time).format("HH:mm:SS");
                    var work_off_time = single_work_time.work_off_time; //上班时间
                    var indure_time_off = single_work_time.indure_time_off; //容差时长
                    //,休息之前 =打卡时间 - 下班时间+休息时间
                    if (moment.duration(leave_time) - moment.duration(single_work_time.rest_start) < 0) {
                        var data = (moment.duration(leave_time) - moment.duration(work_off_time) + (moment.duration(single_work_time.rest_end) - moment.duration(single_work_time.rest_start))) / 60000;
                        //休息时间内= 休息时间开始-下班时间
                    } else if (moment.duration(leave_time) >= moment.duration(single_work_time.rest_start) && moment.duration(leave_time) <= moment.duration(single_work_time.rest_end)) {
                        var data = (moment.duration(single_work_time.rest_end) - moment.duration(work_off_time)) / 60000;
                    } else {
                        //休息之后才打上班卡  =打卡时间 - 下班时间
                        var data = (moment.duration(leave_time) - moment.duration(work_off_time)) / 60000;
                    };
                    if (-data < indure_time_off) {
                        obj.work_result.push('CL');
                    } else {
                        obj.work_result.push('E');
                        obj.work_pay.leave_time = -data; //迟到分钟数
                    }
                } else {
                    obj.work_result.push('NCA');
                    obj.work_pay.no_card_num = 0
                    obj.work_pay.no_card_num += 1;
                }


            } else {
                obj.work_result.push('A');
                obj.work_result.push('NCM');
                obj.work_result.push('NCA');
                obj.work_pay.absence_num = 1;
            };
            if (filter_wf_beyond_work.length > 0) {

                var single_data = _.find(filter_wf_beyond_work[0].data, function(w) {
                    return format(w.start_date) == String(format(temp.job_date))
                })
                if (single_data) {
                    obj.work_result.push('B');
                    if (!~obj.work_result.indexOf('CC')) {
                        obj.work_result.push('CC');

                    }
                    if (!~obj.work_result.indexOf('CL')) {
                        obj.work_result.push('CL');

                    }
                    if (single_data.is_full_day) { //移除迟到，早退和旷工的
                        if (!!~obj.work_result.indexOf('L')) {
                            var index = obj.work_result.indexOf('L');
                            obj.work_result.splice(index, 1);
                            obj.work_pay.late_time = 0;

                        }
                        if (!!~obj.work_result.indexOf('E')) {
                            var index = obj.work_result.indexOf('E');
                            obj.work_result.splice(index, 1);
                            obj.work_pay.leave_time = 0;
                        }
                        if (!!~obj.work_result.indexOf('A')) {
                            var index = obj.work_result.indexOf('A');
                            obj.work_result.splice(index, 1);
                            obj.work_pay.absence_num = 0;
                        }

                    }
                    obj.work_pay.beyond_work = single_data.total_time;
                    obj.work_pay.is_exchange = filter_wf_beyond_work[0].is_exchange;
                    obj.work_pay.category = filter_wf_beyond_work[0].category ? filter_wf_beyond_work[0].category : '1';
                }
            }
            if (filter_wf_work_city.length > 0) {
                var single_data = _.find(filter_wf_work_city[0].data, function(w) {
                    return format(w.start_date) == String(format(temp.job_date))
                })
                if (single_data) {
                    obj.is_beyond_work = true;
                    obj.work_result.push('C');
                    if (!~obj.work_result.indexOf('CC')) {
                        obj.work_result.push('CC');

                    }
                    if (!~obj.work_result.indexOf('CL')) {
                        obj.work_result.push('CL');

                    }
                    if (single_data.is_full_day) { //移除迟到，早退和旷工的
                        if (!!~obj.work_result.indexOf('L')) {
                            var index = obj.work_result.indexOf('L');
                            obj.work_result.splice(index, 1);
                            obj.work_pay.late_time = 0;

                        }
                        if (!!~obj.work_result.indexOf('E')) {
                            var index = obj.work_result.indexOf('E');
                            obj.work_result.splice(index, 1);
                            obj.work_pay.leave_time = 0;
                        }
                        if (!!~obj.work_result.indexOf('A')) {
                            var index = obj.work_result.indexOf('A');
                            obj.work_result.splice(index, 1);
                            obj.work_pay.absence_num = 0;
                        }

                    } else {
                        if (single_data.time_zone_s == String(single_data.work_on_time)) {
                            if (!~obj.work_result.indexOf('CC')) {
                                obj.work_result.push('CC');

                            }

                        }
                        if (single_data.time_zone_e == String(single_data.work_off_time)) {
                            if (!~obj.work_result.indexOf('CL')) {
                                obj.work_result.push('CL');

                            }

                        }

                    }
                }
            }

            if (filter_wf_work_travel.length > 0) {
                var single_data = _.find(filter_wf_work_travel[0].data, function(w) {
                    return format(w.start_date) == String(format(temp.job_date))
                })
                if (single_data) {
                    obj.is_beyond_work = true;
                    obj.work_result.push('W');
                    if (!~obj.work_result.indexOf('CC')) {
                        obj.work_result.push('CC');

                    }
                    if (!~obj.work_result.indexOf('CL')) {
                        obj.work_result.push('CL');

                    }
                    if (single_data.is_full_day) { //移除迟到，早退和旷工的
                        if (!!~obj.work_result.indexOf('L')) {
                            var index = obj.work_result.indexOf('L');
                            obj.work_result.splice(index, 1);
                            obj.work_pay.late_time = 0;

                        }
                        if (!!~obj.work_result.indexOf('E')) {
                            var index = obj.work_result.indexOf('E');
                            obj.work_result.splice(index, 1);
                            obj.work_pay.leave_time = 0;
                        }
                        if (!!~obj.work_result.indexOf('A')) {
                            var index = obj.work_result.indexOf('A');
                            obj.work_result.splice(index, 1);
                            obj.work_pay.absence_num = 0;
                        }

                    }
                }
            }
            if (filter_wf_absence.length > 0) {
                var single_data = _.find(filter_wf_absence[0].data, function(w) {
                    return format(w.start_date) == String(format(temp.job_date))
                })
                if (single_data) {
                    obj.is_beyond_work = true;
                    obj.work_result.push('H');
                    if (!~obj.work_result.indexOf('CC')) {
                        obj.work_result.push('CC');

                    }
                    if (!~obj.work_result.indexOf('CL')) {
                        obj.work_result.push('CL');

                    }
                    if (single_data.is_full_day) { //移除迟到，早退和旷工的
                        if (!!~obj.work_result.indexOf('L')) {
                            var index = obj.work_result.indexOf('L');
                            obj.work_result.splice(index, 1);
                            obj.work_pay.late_time = 0;

                        }
                        if (!!~obj.work_result.indexOf('E')) {
                            var index = obj.work_result.indexOf('E');
                            obj.work_result.splice(index, 1);
                            obj.work_pay.leave_time = 0;
                        }
                        if (!!~obj.work_result.indexOf('A')) {
                            var index = obj.work_result.indexOf('A');
                            obj.work_result.splice(index, 1);
                            obj.work_pay.absence_num = 0;
                        }

                    }
                }
            }
            if (filter_wf_change.length > 0) {
                var single_data = _.find(filter_wf_change, function(w) {
                    return format(w.change_date) == String(format(temp.job_date))
                })

                if (single_data) {
                    obj.work_result.push('I');
                }
            }

            result_data.push(obj);
        });

    } else { //逆向考勤入口
        //遍历正常工作日历
        _.each(change_work_plan_cd, function(temp) {
            //工作时间
            var single_work_time = _.find(worktime, function(w) {
                return String(temp.work_time) == w._id;
            });
            //*{//跑流程中的数据
            //加班、差旅、公干
            var filter_wf_beyond_work = _.filter(wf_three, function(wf) {
                    var if_equal = _.find(wf.data, function(w) {
                        return format(temp.job_date) == String(format(w.start_date)) && format(temp.job_date) == String(format(w.end_date))
                    })
                    return wf.absence_type == 'B' && if_equal

                })
                //差旅
            var filter_wf_work_travel = _.filter(wf_three, function(wf) {
                    var if_equal = _.find(wf.data, function(w) {
                        return format(temp.job_date) == String(format(w.start_date)) && format(temp.job_date) == String(format(w.end_date))
                    })
                    return wf.absence_type == 'W' && if_equal
                })
                //市区公干
            var filter_wf_work_city = _.filter(wf_three, function(wf) {
                    var if_equal = _.find(wf.data, function(w) {
                        return format(temp.job_date) == String(format(w.start_date)) && format(temp.job_date) == String(format(w.end_date))
                    })
                    return wf.absence_type == 'C' && if_equal


                })
                //请假
            var filter_wf_absence = _.filter(wf_absence, function(wf) {
                var if_equal = _.find(wf.data, function(w) {
                    return format(temp.job_date) == String(format(w.start_date)) && format(temp.job_date) == String(format(w.end_date))
                })
                return if_equal


            })
            var filter_wf_change = _.filter(wf_change, function(wf) {
                return format(temp.job_date) == String(format(wf.change_date))


            })

            //}*
            var obj = {}; //考勤时间
            if (pep_card_record) {
                var pep_sign_style = pep.which_sign_style ? pep.which_sign_style : [];
                var temp_obj = {},
                    temp_arr = [];
                if (sign_first) {
                    _.each(sign_first.style_order, function(s) {
                        if (s) {
                            temp_obj[s.sign_style] = s.sign_order;

                        }
                    });
                }

                _.each(pep_sign_style, function(s) {
                    temp_arr.push(temp_obj[String(s)]);
                })
                temp_arr = _.sortBy(temp_arr, function(t) {
                    return t;
                });
                temp_arr.reverse();
                var card_record_day = null;
                var temp_pop_data = temp_arr.pop();
                if (temp_pop_data == '0') {
                    temp_pop_data == 'B'
                }
                sign_sort(temp_pop_data, sign_first, pep_card_record)

                function sign_sort(temp_pop_data, sign_first, pep_card_record) {
                    if (temp_pop_data == 'B') {
                        temp_pop_data = 0;
                    }
                    if (sign_first) {
                        var single_sign = _.find(sign_first.style_order, function(s) {
                            return s.sign_order == String(temp_pop_data)
                        });
                    }

                    var sign_rule = single_sign ? single_sign.sign_style : 'P';
                    card_record_day = _.find(pep_card_record.record_data, function(card) {
                        return card.which_sign_style == String(sign_rule) && card.card_time == String(moment(temp.job_date).format('YYYY-MM-DD')) && temp.is_job_day;
                    });
                    var temp_pop_data = temp_arr.pop();
                    if (temp_pop_data == '0') {
                        temp_pop_data == 'B'
                    }
                    if (!card_record_day && temp_pop_data) {
                        sign_sort(temp_pop_data, sign_first, pep_card_record)
                    }

                }


                // console.log(card_record_day);

            };


            obj.job_date = temp.job_date;
            obj.work_time = temp.work_time;
            obj.work_time_name = temp.work_time_name;
            obj.work_plan_name = single_work_plan.plan_name;
            obj.work_plan = single_work_plan._id;
            obj.is_job_day = temp.is_job_day;

            obj.work_result = [];
            obj.work_pay = {};

            if (card_record_day) {
                //上班
                if (card_record_day.come_time) {
                    obj.work_result.push('CC');
                } else {
                    obj.work_result.push('NCM');
                    obj.work_result.push('CC');

                    obj.work_pay.no_card_num = 0;
                }
                //下班
                if (card_record_day.leave_time) {
                    obj.work_result.push('CL');
                } else {
                    obj.work_result.push('NCA');
                    obj.work_result.push('CL');
                    obj.work_pay.no_card_num = 0;
                }
            } else {
                obj.work_result.push('NCM');
                obj.work_result.push('NCA');
                obj.work_result.push('CC');
                obj.work_result.push('CL');

                obj.work_pay.absence_num = 0;
            };
            if (filter_wf_beyond_work.length > 0) {

                var single_data = _.find(filter_wf_beyond_work[0].data, function(w) {
                    return format(w.start_date) == String(format(temp.job_date))
                })
                if (single_data) {
                    obj.work_result.push('B');
                    if (!~obj.work_result.indexOf('CC')) {
                        obj.work_result.push('CC');

                    }
                    if (!~obj.work_result.indexOf('CL')) {
                        obj.work_result.push('CL');

                    }
                    if (single_data.is_full_day) { //移除迟到，早退和旷工的
                        if (!!~obj.work_result.indexOf('L')) {
                            var index = obj.work_result.indexOf('L');
                            obj.work_result.splice(index, 1);
                            obj.work_pay.late_time = 0;

                        }
                        if (!!~obj.work_result.indexOf('E')) {
                            var index = obj.work_result.indexOf('E');
                            obj.work_result.splice(index, 1);
                            obj.work_pay.leave_time = 0;
                        }
                        if (!!~obj.work_result.indexOf('A')) {
                            var index = obj.work_result.indexOf('A');
                            obj.work_result.splice(index, 1);
                            obj.work_pay.absence_num = 0;
                        }

                    }
                    obj.work_pay.beyond_work = single_data.total_time;
                    obj.work_pay.is_exchange = filter_wf_beyond_work[0].is_exchange;
                    obj.work_pay.category = filter_wf_beyond_work[0].category ? filter_wf_beyond_work[0].category : '1';
                }
            }
            if (filter_wf_work_city.length > 0) {
                var single_data = _.find(filter_wf_work_city[0].data, function(w) {
                    return format(w.start_date) == String(format(temp.job_date))
                })
                if (single_data) {
                    obj.is_beyond_work = true;
                    obj.work_result.push('C');
                    if (!~obj.work_result.indexOf('CC')) {
                        obj.work_result.push('CC');

                    }
                    if (!~obj.work_result.indexOf('CL')) {
                        obj.work_result.push('CL');

                    }
                    if (single_data.is_full_day) { //移除迟到，早退和旷工的
                        if (!!~obj.work_result.indexOf('L')) {
                            var index = obj.work_result.indexOf('L');
                            obj.work_result.splice(index, 1);
                            obj.work_pay.late_time = 0;

                        }
                        if (!!~obj.work_result.indexOf('E')) {
                            var index = obj.work_result.indexOf('E');
                            obj.work_result.splice(index, 1);
                            obj.work_pay.leave_time = 0;
                        }
                        if (!!~obj.work_result.indexOf('A')) {
                            var index = obj.work_result.indexOf('A');
                            obj.work_result.splice(index, 1);
                            obj.work_pay.absence_num = 0;
                        }

                    } else {
                        if (single_data.time_zone_s == String(single_data.work_on_time)) {
                            if (!~obj.work_result.indexOf('CC')) {
                                obj.work_result.push('CC');

                            }

                        }
                        if (single_data.time_zone_e == String(single_data.work_off_time)) {
                            if (!~obj.work_result.indexOf('CL')) {
                                obj.work_result.push('CL');

                            }

                        }

                    }
                }
            }

            if (filter_wf_work_travel.length > 0) {
                var single_data = _.find(filter_wf_work_travel[0].data, function(w) {
                    return format(w.start_date) == String(format(temp.job_date))
                })
                if (single_data) {
                    obj.is_beyond_work = true;
                    obj.work_result.push('W');
                    if (!~obj.work_result.indexOf('CC')) {
                        obj.work_result.push('CC');

                    }
                    if (!~obj.work_result.indexOf('CL')) {
                        obj.work_result.push('CL');

                    }
                    if (single_data.is_full_day) { //移除迟到，早退和旷工的
                        if (!!~obj.work_result.indexOf('L')) {
                            var index = obj.work_result.indexOf('L');
                            obj.work_result.splice(index, 1);
                            obj.work_pay.late_time = 0;

                        }
                        if (!!~obj.work_result.indexOf('E')) {
                            var index = obj.work_result.indexOf('E');
                            obj.work_result.splice(index, 1);
                            obj.work_pay.leave_time = 0;
                        }
                        if (!!~obj.work_result.indexOf('A')) {
                            var index = obj.work_result.indexOf('A');
                            obj.work_result.splice(index, 1);
                            obj.work_pay.absence_num = 0;
                        }

                    }
                }
            }
            if (filter_wf_absence.length > 0) {
                var single_data = _.find(filter_wf_absence[0].data, function(w) {
                    return format(w.start_date) == String(format(temp.job_date))
                })
                if (single_data) {
                    obj.is_beyond_work = true;
                    obj.work_result.push('H');
                    if (!~obj.work_result.indexOf('CC')) {
                        obj.work_result.push('CC');

                    }
                    if (!~obj.work_result.indexOf('CL')) {
                        obj.work_result.push('CL');

                    }
                    if (single_data.is_full_day) { //移除迟到，早退和旷工的
                        if (!!~obj.work_result.indexOf('L')) {
                            var index = obj.work_result.indexOf('L');
                            obj.work_result.splice(index, 1);
                            obj.work_pay.late_time = 0;

                        }
                        if (!!~obj.work_result.indexOf('E')) {
                            var index = obj.work_result.indexOf('E');
                            obj.work_result.splice(index, 1);
                            obj.work_pay.leave_time = 0;
                        }
                        if (!!~obj.work_result.indexOf('A')) {
                            var index = obj.work_result.indexOf('A');
                            obj.work_result.splice(index, 1);
                            obj.work_pay.absence_num = 0;
                        }

                    }
                }
            }
            if (filter_wf_change.length > 0) {
                var single_data = _.find(filter_wf_change, function(w) {
                    return format(w.change_date) == String(format(temp.job_date))
                })

                if (single_data) {
                    obj.work_result.push('I');
                }
            }

            result_data.push(obj);
        });
        //遍历调休日期
    };
    return result_data;
}

function format(date) {
    return moment(date).format("YYYYMMDD")
}
//人员考勤结果BACKBONE数据
var attend_result_bb_list = function(req, res) {
    var i18n = req.i18n;
    var client = req.user.client.id;
    AttendanceResult.find({
        client: client,
    }).exec(function(err, result) {
        if (err) {
            return res.json({
                code: 'ERR',
                msg: '内部服务器错误：' + err
            });
        } else {
            return res.json(result);
        };
    })
}
var attend_result_bb_fetch = function(req, res) {
    var i18n = req.i18n;
    var up_id = req.params.up_id;
    async.waterfall([

        function(cb) {
            AttendanceResult.findById(up_id).exec(cb);
        },
    ], function(err, result) {
        if (err) {
            return res.json({
                code: 'ERR',
                msg: '内部服务器错误：' + err
            });
        } else {
            return res.json(result);
        };
    })
};
var filter_attend_data = function(req, res) {
    var client = req.user.client.id;
    var year = req.body.year;
    var month = Number(req.body.month) + 1;
    if (month < 10) {
        var filter_date = year + '-0' + month;

    } else {
        var filter_date = year + '-' + month;

    };
    var pep_id = req.body.pep_id;
    AttendanceResult.find({
        client: client,
        people: pep_id
    }).populate({
        path: 'people',
        select: '_id people_name is_positive_attendance'
    }).populate('data.work_plan').exec(function(err, result) {
        var union_arr = [],
            obj = {};
        _.each(result, function(data) {
            _.each(data.data, function(temp) {
                if (temp.is_job_day && moment(temp.job_date).format('YYYY-MM') == String(filter_date)) {
                    obj[temp._id] = temp.work_plan._id;
                    union_arr.push(temp);
                }
            })
        });
        if (err) {
            return res.json({
                code: 'ERR',
                msg: '内部服务器错误'
            })
        }
        return res.json({
            'code': 'OK',
            data: union_arr,
            obj: obj
        })

    })

};
var attend_edit = function(req, res) {
    var client = req.user.client.id;
    var pep_id = req.query.pep_id;
    var plan_id = req.query.plan_id;
    var data_id = req.query.data_id;
    var render_data = {
        title: '人员考勤结论-编辑',
        user: req.user,
        _: us,
        moment: moment
    };
    AttendanceResult.findOne({
        client: client,
        people: pep_id,
        work_plan: plan_id
    }).populate('people').select('_id people data').exec(function(err, result) {
        if (err) {
            return res.json({
                code: 'ERR',
                msg: '内部服务器错误'
            })
        };
        if (result) {
            var single_data = _.find(result.data, function(temp) {
                return temp._id == String(data_id)
            });
            render_data.people = result.people;
            render_data._id = result._id;
            render_data.single_data = single_data ? single_data : '';
            var arr = [];
            if (!!~single_data.work_result.indexOf('L')) {
                arr.push(true);
            } else {
                arr.push(false);
            };
            if (!!~single_data.work_result.indexOf('E')) {
                arr.push(true);
            } else {
                arr.push(false);
            };
            if (!!~single_data.work_result.indexOf('NCM')) {
                arr.push(true);
            } else {
                arr.push(false);
            };
            if (!!~single_data.work_result.indexOf('NCA')) {
                arr.push(true);
            } else {
                arr.push(false);
            };
            if (!!~single_data.work_result.indexOf('A') || (!!~single_data.work_result.indexOf('NCA') && !!~single_data.work_result.indexOf('NCM'))) {
                arr.push(true);
            } else {
                arr.push(false);
            };
            if (!!~single_data.work_result.indexOf('CC') && !!~single_data.work_result.indexOf('CL')) {
                arr.push(true);
            } else {
                arr.push(false);
            };
            render_data.arr = arr;
            res.render('admin/tm/cardrecord/attend_edit', render_data);
        }
    })
};
var attend_edit_save = function(req, res) {
        var client = req.user.client.id;
        var record_id = req.body.record_id;
        var data_id = req.body.data_id;
        var change_reason = req.body.change_reason;
        var work_result = JSON.parse(req.body.work_result);
        AttendanceResult.findById(record_id).exec(function(err, result) {
            if (err) {
                return res.json({
                    code: 'ERR',
                    msg: '内部服务器错误'
                })
            }
            if (result) {
                var single_data = _.find(result.data, function(temp) {
                    return temp._id == String(data_id);
                });
                if (single_data.is_change) {
                    var old_work_result = single_data.work_result;
                    var obj = {
                        work_result: old_work_result,
                        stamp: new Date(),
                        people: req.user.people.id,
                        change_reason: change_reason
                    }
                    single_data.change_result.push(obj);
                } else {
                    single_data.is_change = true;
                    var old_work_result = single_data.work_result;
                    var obj = {
                        work_result: old_work_result,
                        stamp: new Date(),
                        people: req.user.people.id,
                        change_reason: change_reason
                    }
                    single_data.change_result = [];
                    single_data.change_result.push(obj);
                };
                single_data.work_result = work_result;
                result.save();
                return res.json({
                    'code': 'OK',
                    'msg': '人员考勤结论修改成功!!!'
                })
            }


        })
    }
    //人员签到方式配置
var sign_style = function(req, res) {
    var i18n = req.i18n;
    var client = req.user.client.id;

    var render_data = {
        title: '人员签到方式-赋予',
        user: req.user,
        _: us,
        moment: moment
    };
    People.find({
        client: client,
        block: false,
        employee_status: {
            $ne: 'R'
        },
        company: {
            $in: req.user.companies
        }
    }).select('_id people_name position_name people_no company_name which_sign_style').exec(function(err, result) {
        render_data.pep_data = result;
        res.render('admin/tm/cardrecord/pep_work_style', render_data);

    })
};
var sign_rule = function(req, res) {
    var i18n = req.i18n;
    var client = req.user.client.id;
    var pep_id = req.params.pep_id;
    var render_data = {
        title: '人员签到方式-赋予',
        user: req.user,
        _: us,
        modi_type: 'edit',
        moment: moment
    };
    async.parallel({
        pep: function(cb) {
            People.findById(pep_id).exec(cb)
        },
    }, function(err, result) {
        render_data.pep_data = result.pep;
        res.render('admin/tm/cardrecord/pep_work_style_edit', render_data);
    })
};
var sign_rule_save = function(req, res) {
    var i18n = req.i18n;
    var client = req.user.client.id;
    var pep_id = req.body.pep_id;
    var which_sign_style = String(req.body.which_sign_style).split(',');
    People.findById(pep_id).exec(function(err, result) {
        if (err) {
            return res.status(500).json({
                code: 'ERR',
                msg: '内部服务器错误：' + err
            });
        };
        if (result) {
            result.which_sign_style = which_sign_style;
            result.save();
            return res.json({
                code: 'OK',
                msg: sprintf('数据保存成功！'),
            });
        } else {
            return res.status(500).json({
                code: 'ERR',
                msg: '数据保存失败'
            });
        };
    })
};
var pep_sign_style_batch = function(req, res) {
    var i18n = req.i18n;
    var client = req.user.client.id;

    var render_data = {
        title: '人员签到方式-赋予',
        user: req.user,
        _: us,
        moment: moment
    };
    res.render('admin/tm/cardrecord/pep_work_style_batch', render_data);
};
var sign_rule_position_help_json = function(req, res) {
    var client = req.user.client;
    var c_type = req.params.c_type;
    var cond = {
        client: client
    };
    if (c_type == 'c') {
        cond.which_sign_style = null;
    } else {
        cond.which_sign_style = {
            $ne: null
        }
    }
    async.waterfall([

        function(cb) {
            async.parallel({
                companys: function(cb) {
                    Company.find({
                        _id: {
                            $in: req.user.companies
                        },
                    }, cb);
                },
                ous: function(cb) {
                    OrganizationUnit.find({
                        client: client.id,
                        company: {
                            $in: req.user.companies
                        },
                    }).populate('parent_ou').exec(cb);
                },
                pos: function(cb) {
                    Position.find({
                        client: client.id,
                        company: {
                            $in: req.user.companies
                        },
                    }).populate('position_direct_superior belongto_ou').exec(cb);
                },
                pep: function(cb) {
                    People.find(cond).populate('position').select('position').exec(function(err, positions) {
                        if (positions.length > 0) {
                            var pps = [];
                            us.each(positions, function(s) {
                                if (s.position) {
                                    pps.push(String(s.position._id))

                                }
                            })
                            cb(null, pps)
                        } else {
                            cb(null, null)
                        }
                    })
                }
            }, cb);
        },
        function(dc, cb) {
            var ret_data = [];
            _.each(dc.companys, function(d) {
                var row = {
                    'id': d._id,
                    'pId': null,
                    'name': d.company_name,
                    'type': 'c'
                };
                ret_data.push(row);
                var f_os = us.filter(dc.ous, function(o) {
                    return o.company == String(d._id)
                })
                _.each(f_os, function(o) {
                    if (!o.parent_ou) {
                        var row = {
                            'id': o._id,
                            'pId': d._id,
                            'name': o.ou_name,
                            'type': 'o'
                        };
                        ret_data.push(row);
                    } else {
                        if (o.parent_ou.company == String(d._id)) {
                            var row = {
                                'id': o._id,
                                'pId': o.parent_ou._id,
                                'name': o.ou_name,
                                'type': 'o'
                            };
                            ret_data.push(row);
                        } else {
                            var row = {
                                'id': o._id,
                                'pId': d._id,
                                'name': o.ou_name,
                                'type': 'o'
                            };
                            ret_data.push(row);
                        }
                    }
                    var o_p = _.filter(dc.pos, function(p) {
                        return !!~dc.pep.indexOf(String(p._id))
                    })
                    var f_ps = _.filter(o_p, function(p) {
                        return p.belongto_ou._id == String(o._id)
                    })
                    _.each(f_ps, function(p) {
                        if (p.position_manager) {
                            if (!p.position_direct_superior) {
                                var row = {
                                    'id': p._id,
                                    'pId': o._id,
                                    'name': sprintf('<span class="label label-info" style="padding:1px;">%s</span>', p.position_name),
                                    'type': 'p'
                                };
                                ret_data.push(row);
                            } else {
                                if (p.position_direct_superior.belongto_ou._id == String(o._id)) {
                                    var row = {
                                        'id': p._id,
                                        'pId': p.position_direct_superior._id,
                                        'name': sprintf('<span class="label label-info" style="padding:1px;">%s</span>', p.position_name),
                                        'type': 'p'
                                    };
                                    ret_data.push(row);
                                } else {
                                    var row = {
                                        'id': p._id,
                                        'pId': o._id,
                                        'name': sprintf('<span class="label label-info" style="padding:1px;">%s</span>', p.position_name),
                                        'type': 'p'
                                    };
                                    ret_data.push(row);
                                }
                            }
                        } else {
                            if (!p.position_direct_superior) {
                                var row = {
                                    'id': p._id,
                                    'pId': o._id,
                                    'name': p.position_name,
                                    'type': 'p'
                                };
                                ret_data.push(row);
                            } else {
                                if (p.position_direct_superior.belongto_ou._id == String(o._id)) {
                                    var row = {
                                        'id': p._id,
                                        'pId': p.position_direct_superior._id,
                                        'name': p.position_name,
                                        'type': 'p'
                                    };
                                    ret_data.push(row);
                                } else {
                                    var row = {
                                        'id': p._id,
                                        'pId': o._id,
                                        'name': p.position_name,
                                        'type': 'p'
                                    };
                                    ret_data.push(row);
                                }
                            }
                        }


                    })
                })


            })

            cb(null, ret_data);
        }
    ], function(err, result) {
        res.send(result);
    })
};

var sign_rule_get_data = function(req, res) {
    var client = req.user.client.id;
    var which_sign_style = req.body.which_sign_style;
    var pps = JSON.parse(req.body.pps);
    var type = req.body.type;
    var msg = '配置成功！！';
    var msg_c = '配置失败！！';
    if (type == 'u') {
        msg = '修改成功！！';
        msg_c = '修改失败！！';
    };
    async.times(pps.length, function(n, next) {
        People.find({
            client: client,
            position: pps[n]
        }, function(err, result) {
            if (result) {
                async.times(result.length, function(n, next) {
                    var res = result[n];
                    res.which_sign_style = which_sign_style;
                    res.save(next)
                }, next)
            } else {
                next(null, null)
            }
        })
    }, function(err, result) {
        if (err) {
            res.json({
                code: 'ERR',
                msg: msg_c
            })
        };
        if (result.length > 0) {
            res.json({
                code: 'OK',
                msg: msg
            })
        }
    })

};
var pep_sign_style_del = function(req, res) {
    var client = req.user.client.id;
    var pep_id = req.body.pep_id;
    People.findById(pep_id).exec(function(err, result) {
        if (err) {
            return res.json({
                code: 'ERR',
                msg: '内部服务器错误：' + err
            })
        }
        if (result) {
            result.which_sign_style = null;
            result.save();
            return res.json({
                code: 'OK',
                msg: '数据删除成功！！！'
            })
        } else {
            return res.json({
                code: 'OK',
                msg: '数据删除失败！！！'
            })
        }
    })
};
//签到方式配置
var sign_style_config = function(req, res) {
    var i18n = req.i18n;
    var client = req.user.client.id;

    var render_data = {
        title: '签到方式-配置',
        user: req.user,
        _: us,
        moment: moment
    };
    SignStyleConfig.findOne({
        client: client
    }).exec(function(err, result) {
        if (result) {
            render_data.result = result;
            res.render('admin/tm/cardrecord/sign_style', render_data);
        } else {
            var style_obj = {
                'P': 'PC签到',
                'M': '移动签到',
                'I': '考勤机'
            };
            var order_obj = {
                'P': 0,
                'M': 1,
                'I': 2
            };
            var temp_arr = _.keys(style_obj);
            var style_order = [];
            _.each(temp_arr, function(temp) {
                style_order.push({
                    'sign_style': temp,
                    'sign_order': order_obj[temp]
                })
            })
            var createdata = {
                client: client,
                style_order: style_order
            }
            SignStyleConfig.create(createdata, function(err, result) {
                render_data.result = result;
                res.render('admin/tm/cardrecord/sign_style', render_data);
            })
        }


    })
};
//签到方式backbone
var sign_style_bb_fetch = function(req, res) {
    var i18n = req.i18n;
    var client = req.user.client.id;
    var sc_id = req.params.sc_id;
    SignStyleConfig.findById(sc_id, function(err, scc) {
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

var sign_style_bb_update = function(req, res) {
    var i18n = req.i18n;
    var client = req.user.client.id;
    var sc_id = req.params.sc_id;
    var data4update = {
        client: client,
        style_order: req.body.style_order,
    };

    SignStyleConfig.findByIdAndUpdate(sc_id, data4update, function(err, scc) {
        if (err) {
            return res.status(500).json({
                code: 'ERR',
                msg: '内部服务器错误：' + err
            });
        };
        if (scc) {
            return res.json({
                code: 'OK',
                msg: sprintf('签到方式保存成功！'),
                _id: scc._id,
            });
        } else {
            return res.status(500).json({
                code: 'ERR',
                msg: '假期类型保存失败'
            });
        };
    });
}

//打卡记录模板下载
var cmd = [
    'python',
    fs.realpathSync(__dirname + '/../../tools/genexcel.py'),
]
var temp_file = fs.realpathSync(__dirname + '/../../tools/temp.json');

//导出EXCEL表
var card_record_template_download = function(req, res) {
    var company = req.params.company;
    async.series({
        data_json: function(cb) {
            get_json(req, res, function(data) {
                cb(null, data)
            });
        },
        json2excel: function(cb) {
            json2excel(req, res, function(data) {
                cb(null, data)
            })

        },
        company: function(cb) {
            Company.findById(company, cb)
        }
    }, function(err, result) {
        var str_url = result.json2excel;
        str_url = str_url.split('\n')
        var fname = encodeURIComponent(result.company.company_name + '(考勤数据).xls')
        res.set('Content-Disposition', 'attachment; filename="' + fname + '" ;filename*=utf-8\'\'' + fname)
        res.sendfile(String(str_url[0]));
    })
}

function get_json(req, res, cb) {
    var client = req.user.client.id;
    var pay_start_date = req.user.client.config.payroll.pay_start_date;
    var date = moment(new Date()).format('YYYY-MM');

    var validFrom = moment(date).subtract('months', 1).format('YYYY-MM-DD');
    validFrom = moment(validFrom).add('day', parseInt(pay_start_date) - 1).format('YYYY-MM-DD');

    var validTo = moment(validFrom).add('months', 2).format('YYYY-MM-DD');
    validTo = moment(validTo).subtract('day', 1).format('YYYY-MM-DD');
    var target_company = req.params.company;
    async.waterfall([

        function(cb) {
            People.find({
                client: client,
                company: target_company,
                payroll_state: true
            }).populate('tm_work_plan').select('_id tm_work_plan people_name people_no').sort({
                people_no: -1
            }).exec(function(err, result) {
                var pep_absences = [];
                pep_absences.push('工号');
                pep_absences.push('姓名');
                pep_absences.push('日期');
                pep_absences.push('是否工作日');
                pep_absences.push('上班时间(格式: ' + moment().format("YYYY-MM-DD HH:mm") + ')');
                pep_absences.push('下班时间(格式: ' + moment().format("YYYY-MM-DD HH:mm") + ')');
                var tm = {},
                    cal_len = 0;
                tm.ws_name = '打卡记录';
                tm.col_num = '10';
                tm.data = [];
                for (var i = 0; i < pep_absences.length; i++) {
                    tm.data.push({
                        "row": 0,
                        "col": i,
                        "text": pep_absences[i],
                    });
                }
                var r_clone = _.clone(result);
                var people_data = _.sortBy(r_clone, function(temp) {
                    return parseInt(temp.people_no)
                })
                async.times(people_data.length, function(n, next) {
                    var pep_data = people_data[n];
                    PeopleWorkCalendar.findOne({
                        client: client,
                        people: pep_data._id
                    }).exec(function(err, cal) {
                        // console.log(cal);
                        if (cal) {
                            var calendar_data = cal.calendar_data;
                            calendar_data = _.filter(calendar_data, function(temp) {
                                return format(temp.job_date) >= format(validFrom) && format(temp.job_date) <= format(validTo)
                            })
                            calendar_data = _.sortBy(calendar_data, function(temp) {
                                return format(temp.job_date)
                            })
                            cal_len += calendar_data.length;
                            get_excel_data(calendar_data, pep_data, cal_len);
                            next(null, null)
                        } else {
                            var single_work_plan = _.find(pep_data.tm_work_plan, function(temp) {
                                return moment(new Date()).isBefore(temp.expire_off) && moment(new Date()).isAfter(temp.expire_on)
                            });
                            if (single_work_plan) {
                                if (single_work_plan.calendar_data) {
                                    var calendar_data = single_work_plan.calendar_data;
                                    var temp_calendar_data = _.filter(calendar_data, function(temp) {
                                        return format(temp.job_date) >= format(validFrom) && format(temp.job_date) <= format(validTo)
                                    })
                                    calendar_data = _.sortBy(temp_calendar_data, function(temp) {
                                        return format(temp.job_date)
                                    })
                                    cal_len += calendar_data.length;
                                    get_excel_data(calendar_data, pep_data, cal_len);

                                } else {
                                    //run work_plan change data
                                }


                            }
                            next(null, null)
                        }
                    })

                    function format(date) {
                        return moment(date).format('YYYYMMDD');
                    }

                    function get_excel_data(calendar_data, pep_data, cal_len) {
                        var j = 0;
                        for (var i = cal_len - calendar_data.length; i < cal_len; i++) {
                            tm.data.push({
                                "row": i + 1,
                                "col": 0,
                                "text": pep_data.people_no,
                            });
                            tm.data.push({
                                "row": i + 1,
                                "col": 1,
                                "text": pep_data.people_name,
                            });

                            tm.data.push({
                                "row": i + 1,
                                "col": 2,
                                "text": moment(calendar_data[j].job_date).format('YYYY-MM-DD'),
                            });
                            tm.data.push({
                                "row": i + 1,
                                "col": 3,
                                "text": calendar_data[j].is_job_day ? '是' : '否',
                            });

                            j++;
                        };
                    }
                }, function(err, datas) {
                    var obj_data = {};
                    obj_data.filename = "temp.xls";
                    obj_data.worksheets = [];
                    //sort algorith
                    //the key is the row data.exchange it.
                    var col_0_data = _.sortBy(_.filter(tm.data, function(temp) {
                        return temp.col == '0'
                    }), function(temp) {
                        return parseInt(temp.text);
                    });
                    var new_row = [],
                        old_row = [];
                    for (var i = 0; i < col_0_data.length; i++) {
                        old_row.push(col_0_data[i].row);
                        new_row.push(i);
                        col_0_data[i].row = i;
                    }
                    var num_obj = _.object(old_row, new_row);
                    for (var i = 1; i <= 5; i++) {
                        var col_data = _.filter(tm.data, function(temp) {
                            return temp.col == i
                        });
                        for (var j = 0; j < old_row.length; j++) {
                            if (col_data[j]) {
                                var temp_row = col_data[j].row;
                                col_data[j].row = num_obj[temp_row];
                            }
                        }
                    }
                    obj_data.worksheets.push(tm)
                    cb(null, obj_data)
                })
            })


        },
    ], function(err, obj_data) {
        fs.writeFile('./tools/temp.json', JSON.stringify(obj_data), 'utf-8', function(err) {
            if (err) {
                return res.send({
                    'error': err
                });
            };
        })
        cb(null, obj_data)
    })



}

function json2excel(req, res, cb) {
    ccmd = [cmd.join(' '), temp_file].join(' '); //第四步
    exec(ccmd, function(err, stdout, stderr) {
        if (err) {
            return res.send({
                'error': err
            });
        } else if (stderr) {
            return res.send({
                'error': err
            });
        };
        cb(stdout)
    })
}

//运行python脚本的命令行： python zsexcel.py <excel file> <step>
var cmd_excel = [
    'python',
    fs.realpathSync(__dirname + '/../../tools/excel2json.py'),
]

var temp_file_excel = fs.realpathSync(__dirname + '/../../tools/excel2json.json');

var card_record_import_data = function(req, res) {
    var i18n = req.i18n;
    var client = req.user.client.id;
    async.series({

        importdata: function(cb) {
            import_data(req, res, function(data) {
                cb(null, data);
            })
        }
    }, function(err, result) {
        if (err) {
            return res.send({
                'error': err
            })
        };
        if (result) {
            return res.json({
                'success': result.importdata,
                code: 'OK',
            })
        } else {
            return res.json({
                code: 'ERR',
            });
        }

    })


}

function import_data(req, res, cb) {
    var client = req.user.client.id;
    var import_file = req.files.qqfile.path;
    ccmd = [cmd_excel.join(' '), import_file, temp_file_excel].join(' '); //第四步
    // 调用python脚本来解析excel
    exec(ccmd, function(err, stdout, stderr) {
        fs.unlinkSync(import_file); //解析完删掉
        if (err) {
            cb(err)
        };
        ret = JSON.parse(fs.readFileSync(temp_file_excel, "utf-8"));
        if (ret.code == 'OK') {
            var data_objs = ret.data.worksheets;
            // console.log(data_objs);
            async.waterfall([

                function(cb) {
                    async.parallel({
                        pps: function(cb) {
                            People.find({
                                client: client,
                            }).exec(function(err, pps) {
                                var tems1 = [];
                                var tems2 = [];
                                us.each(pps, function(pp) {
                                    tems1.push(pp._id);
                                    tems2.push(pp.people_no)
                                })
                                var pps_obj = us.object(tems2, tems1)
                                cb(null, pps_obj)
                            })
                        }
                    }, cb);
                },
                function(objs, cb) {
                    var pps_obj = objs.pps;
                    async.times(data_objs.length, function(n, next) {
                        //get the sheet name
                        var sheet_name = data_objs[n].ws_name;
                        //get the col/row data
                        var col_row_data = data_objs[n].data;
                        var filter_row_datas = us.filter(col_row_data, function(rows) {
                            return rows.row == 0;
                        })
                        var filter_col_datas = us.filter(col_row_data, function(rows) {
                            return rows.col == 0 && rows.row !== 0;
                        })
                        var pris_row = [];
                        var people_no_col = [];
                        us.each(filter_row_datas, function(pri) {
                            pris_row.push(pri.text);
                        })
                        us.each(filter_col_datas, function(pri) {
                            people_no_col.push(pri.text);
                        })
                        async.times(filter_col_datas.length - 1, function(n, next) {
                            var filter_col_data = filter_col_datas[n + 1];

                            var people_pis = us.filter(col_row_data, function(pd) {
                                return pd.row == filter_col_data.row
                            })
                            var pp_row = [];
                            us.each(people_pis, function(pp_data) {
                                pp_row.push(pp_data.text)
                            })
                            var pp_objs = us.object(pris_row, pp_row);
                            var val = [];
                            for (var key in pp_objs) {
                                var card_record_data = {}
                                card_record_data.name = key;
                                card_record_data.value = pp_objs[key];
                                val.push(card_record_data);
                            }
                            // console.log(val);
                            var people = pps_obj[val[0].value];
                            var temp = val[2];
                            var temp1 = val[3];
                            var temp2 = val[4];
                            var temp3 = val[5];
                            var object = {};
                            if (temp) {
                                object.card_time = temp.value;
                                object.come_time = moment(temp2.value);
                                object.leave_time = moment(temp3.value);
                                object.which_sign_style = 'I'
                            }
                            CardRecord.findOne({
                                client: client,
                                people: people
                            }).exec(function(err, result) {
                                if (result) {
                                    var is_exist_import_record = _.find(result.record_data, function(temp) {
                                        return object.card_time == String(temp.card_time) && temp.which_sign_style == 'I'
                                    });
                                    if (!is_exist_import_record) {
                                        result.record_data.push(object);
                                    } else {
                                        is_exist_import_record.card_time = object.card_time;
                                        is_exist_import_record.come_time = object.come_time;
                                        is_exist_import_record.leave_time = object.leave_time;
                                    }
                                    result.save(next);
                                } else {
                                    var create_data = {
                                        client: client,
                                        people: people,
                                        record_data: object
                                    }
                                    CardRecord.create(create_data, next)
                                }
                            })
                        }, next)
                    }, cb)
                }


            ], function(err, results) {
                cb(results)
            })


        } else {
            cb(null)
        };
    });
}
var card_record_import_list = function(req, res) {
    var client = req.user.client.id;
    var render_data = {
        title: '打卡记录导入-列表',
        user: req.user,
        _: us,
        moment: moment
    };
    // CardRecord.find({
    //     client: client
    // }).populate({
    //     'path': 'people',
    //     'select': '_id people_no people_name company_name position_name ou_name'
    // }).exec(function(err, result) {
    //     var validFrom = moment()
    //     if (result) {
    //         var data = [];
    //         _.each(result, function(temp) {
    //             _.each(temp.record_data, function(r) {
    //                 if (r.which_sign_style == 'I' &&format(r.card_time)) {
    //                     var obj = {
    //                         _id: temp._id,
    //                         people_name: temp.people.people_name,
    //                         people_no: temp.people.people_no,
    //                         company_name: temp.people.company_name,
    //                         position_name: temp.people.position_name,
    //                         ou_name: temp.people.ou_name,
    //                         card_time: r.card_time,
    //                         come_time: r.come_time,
    //                         leave_time: r.leave_time,
    //                         record_id: r._id

    //                     }
    //                     data.push(obj)
    //                 }

    //             })
    //         })
    //         render_data.data = data;
    //         res.render('admin/tm/cardrecord/import_list', render_data);
    //     } else {
    //         res.render('admin/tm/cardrecord/import_list', render_data);

    //     }
    // })
    res.render('admin/tm/cardrecord/import_list', render_data);

}
var people_record_data = function(req, res) {
    var client = req.user.client.id;
    var people = req.body.people;
    CardRecord.findOne({
        client: client,
        people: people
    }).populate({
        'path': 'people',
        'select': '_id people_no people_name company_name position_name ou_name'
    }).exec(function(err, result) {
        if (err) {
            return res.json({
                code: 'ERR',
                msg: '数据获取失败'
            })
        }
        if (result) {
            return res.json({
                code: 'OK',
                data: result
            })
        }
    })
}
module.exports = function(app, checkAuth) {
    var __base_path = '/admin/tm/cardrecord';
    //每日打卡
    app.get(__base_path + '/list', checkAuth, card_record_list);
    app.get(__base_path + '/bb', checkAuth, card_record_bb_list); //列表
    app.get(__base_path + '/bb/:up_id', checkAuth, card_record_bb_fetch); //获取
    app.put(__base_path + '/bb/:up_id', checkAuth, card_record_bb_update); //更新的保存
    //我的打卡记录列表
    app.get(__base_path + '/record_list', checkAuth, my_card_record_list);
    app.get(__base_path + '/panel', checkAuth, tm_config);
    //HR修改界面
    app.get(__base_path + '/hr_list', checkAuth, hr_card_record_list);
    app.get(__base_path + '/people_edit', checkAuth, hr_card_record_edit);
    //HR修改界面VERSION2
    app.get(__base_path + '/hr_list_v2', checkAuth, hr_card_record_list_v2);

    //人员工作时间赋予
    app.get(__base_path + '/time_calendar', checkAuth, pep_work_time);
    app.get(__base_path + '/pep_batch', checkAuth, pep_work_batch);
    app.get(__base_path + '/time_position_help_json/:c_type', checkAuth, time_position_help_json);
    // app.get(__base_path + '/calendar_position_help_json/:c_type', checkAuth, calendar_position_help_json);
    app.post(__base_path + '/people_get_data', checkAuth, people_get_data);
    //人员工作时间&日历 编辑
    app.get(__base_path + '/edit/:pep_id', checkAuth, pep_time_calendar_edit);
    app.post(__base_path + '/edit', checkAuth, pep_time_calendar_edit_save);
    app.post(__base_path + '/del', checkAuth, pep_time_calendar_del);
    //考勤配置-与薪酬挂钩的
    app.get(__base_path + '/pay_config', checkAuth, card_record_payroll_config);
    app.post(__base_path + '/pay_config', checkAuth, card_record_payroll_config_save);
    app.post(__base_path + '/del_config', checkAuth, card_record_payroll_config_del);

    app.get(__base_path + '/time_calendar_json_data', checkAuth, time_calendar_json_data);
    app.post(__base_path + '/record_json_data', checkAuth, record_json_data);
    app.post(__base_path + '/record_json_data_v2', checkAuth, record_json_data_v2);

    //人员正逆向考勤规则赋予
    app.get(__base_path + '/pep_attendance', checkAuth, pep_attendance);
    app.get(__base_path + '/attend_rule/:pep_id', checkAuth, attend_rule);
    app.post(__base_path + '/attend_rule', checkAuth, attend_rule_save);
    app.get(__base_path + '/attend_batch', checkAuth, pep_attend_batch);
    app.get(__base_path + '/attend_rule_position_help_json/:c_type', checkAuth, attend_rule_position_help_json);
    app.post(__base_path + '/attend_rule_get_data', checkAuth, attend_rule_get_data);
    app.post(__base_path + '/del_rule', checkAuth, pep_attend_rule_del);
    //人员考勤报表
    app.get(__base_path + '/attend_report', checkAuth, attend_report);
    app.post(__base_path + '/attend_report_json', checkAuth, attend_report_json);
    app.post(__base_path + '/refresh_attend_data', checkAuth, refresh_attend_data);
    app.post(__base_path + '/refresh_attend_data_v2', checkAuth, refresh_attend_data_v2);

    //人员考勤结果数据
    app.get(__base_path + '/attend_bb', checkAuth, attend_result_bb_list); //列表
    app.get(__base_path + '/attend_bb/:up_id', checkAuth, attend_result_bb_fetch); //获取
    //人员考勤结果数据过滤
    app.post(__base_path + '/filter_attend_data', checkAuth, filter_attend_data); //列表
    //人员考勤结论编辑
    app.get(__base_path + '/attend_edit', checkAuth, attend_edit); //获取
    app.post(__base_path + '/attend_edit', checkAuth, attend_edit_save); //获取

    //人员签到方式赋予
    app.get(__base_path + '/sign_style', checkAuth, sign_style);
    app.get(__base_path + '/sign_rule/:pep_id', checkAuth, sign_rule);
    app.post(__base_path + '/sign_rule', checkAuth, sign_rule_save);
    app.get(__base_path + '/sign_batch', checkAuth, pep_sign_style_batch);
    app.get(__base_path + '/sign_rule_position_help_json/:c_type', checkAuth, sign_rule_position_help_json);
    app.post(__base_path + '/sign_rule_get_data', checkAuth, sign_rule_get_data);
    app.post(__base_path + '/del_style', checkAuth, pep_sign_style_del);
    //签到方式优先级管理
    app.get(__base_path + '/sign_style_config', checkAuth, sign_style_config);
    // app.get(__base_path + '/get_sign_data', checkAuth, get_sign_data);
    app.get(__base_path + '/style/:sc_id', checkAuth, sign_style_bb_fetch); //获取
    app.put(__base_path + '/style/:sc_id', checkAuth, sign_style_bb_update); //更新的保存

    //打卡记录模板下载
    app.get(__base_path + '/download/:company', checkAuth, card_record_template_download); //更新的保存
    //打卡记录列表
    app.get(__base_path + '/import_list', checkAuth, card_record_import_list); //更新的保存
    // //打卡记录
    app.post(__base_path + '/import_record', checkAuth, card_record_import_data); //更新的保存
    //单个人员打卡记录
    app.post(__base_path + '/people_record_data', checkAuth, people_record_data); //更新的保存

}