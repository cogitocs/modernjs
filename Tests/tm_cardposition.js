var sprintf = require('sprintf').sprintf;
var Company = require('../../models/structure').Company;
var async = require('async');
var us = require('underscore');
var moment = require('moment');
var CardPosition = require('../../models/tm').CardPosition;
var WorkTime = require('../../models/tm').WorkTime;
var WorkCategory = require('../../models/tm').WorkCategory;
var TmWorkPlan = require('../../models/tm').TmWorkPlan;
var Position = require('../../models/position').Position;
var OrganizationUnit = require('../../models/organization').OrganizationUnit;

//工作时间
var WorkTime = require('../../models/tm').WorkTime;
//打卡记录
var CardRecord = require('../../models/tm').CardRecord;
//人员工作日历表
var PeopleWorkCalendar = require('../../models/tm').PeopleWorkCalendar;
var People = require('../../models/people').People;
var PeopleCardPosition = require('../../models/tm').PeopleCardPosition;

var card_position_form = function(req, res) {
    var i18n = req.i18n;
    var client = req.user.client.id;

    var render_data = {
        title: '打卡地点-配置',
        user: req.user,
        _: us,
        moment: moment
    };
    res.render('admin/tm/cardposition/form', render_data);
}
var card_position_list = function(req, res) {
    var i18n = req.i18n;
    var client = req.user.client.id;

    var render_data = {
        title: '打卡地点-列表',
        user: req.user,
        _: us,
        moment: moment
    };
    res.render('admin/tm/cardposition/list', render_data);
}
var get_company_data = function(req, res) {
    var client = req.user.client.id;
    Company.find({
        client: client,
        _id: {
            $in: req.user.companies
        }
    }).select('_id company_name').exec(function(err, result) {
        if (err) {
            return res.json({
                code: 'ERR',
                msg: '内部服务器错误'
            })
        }
        if (result) {
            var obj = {};
            _.each(result, function(temp) {
                obj[temp._id] = temp.company_name;
            });
            return res.json({
                code: 'OK',
                msg: obj
            })
        }
    })
};
var card_position_save = function(req, res) {
    var client = req.user.client.id;
    var company = JSON.parse(req.body.company);
    var position = req.body.position;
    var lng = req.body.lng;
    var lat = req.body.lat;
    var createdata = {
        client: client,
        company: company,
        position: position,
        longitude: lng,
        latitude: lat
    }
    CardPosition.findOne({
        client: client,
        position: position
    }).exec(function(err, result) {
        if (err) {
            return res.json({
                code: 'ERR',
                msg: '内部服务器错误'
            })
        }
        if (result) {
            return res.json({
                code: 'ERR',
                msg: '该位置已保存进数据库中！！！'
            })
        } else {
            CardPosition.create(createdata, function(err, result) {
                if (result) {
                    return res.json({
                        code: 'OK',
                        msg: '数据保存成功'
                    })
                }
            })
        }
    })

};
var card_position_bb_list = function(req, res) {
    var i18n = req.i18n;
    var client = req.user.client.id;

    CardPosition.find({
        client: client
    }).exec(function(err, cardposition) {
        if (err) {
            return res.json({
                code: 'ERR',
                msg: '内部服务器错误：' + err
            });
        } else {
            return res.json(cardposition);
        };
    })
}
var card_position_update = function(req, res) {
    var i18n = req.i18n;
    var client = req.user.client.id;
    var sc_id = req.params.sc_id;
    var data4update = {
        client: client,
        address_arr: req.body.address_arr
    };
    CardPosition.findByIdAndUpdate(sc_id, data4update, function(err, scc) {
        if (err) {
            return res.status(500).json({
                code: 'ERR',
                msg: '内部服务器错误：' + err
            });
        };
        if (scc) {
            return res.json({
                code: 'OK',
                msg: sprintf('考勤组织 <strong>%s</strong> 保存成功！', scc.position),
                _id: scc._id,
            });
        } else {
            return res.status(500).json({
                code: 'ERR',
                msg: '考勤组织保存失败'
            });
        };
    });
}
var card_position_fetch = function(req, res) {
    var i18n = req.i18n;
    var client = req.user.client.id;
    var up_id = req.params.up_id;
    async.waterfall([

        function(cb) {
            CardPosition.findById(up_id).exec(cb);
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
var card_position_bb_delete = function(req, res) {
        var i18n = req.i18n;
        var client = req.user.client.id;
        var up_id = req.params.up_id;
        CardPosition.findByIdAndRemove(up_id, function(err, up) {
            if (err) {
                return res.status(500).json({
                    code: 'ERR',
                    msg: '内部服务器错误：' + err
                });
            };
            if (up) {
                // console.log(up);
                return res.json({
                    code: 'OK',
                    msg: sprintf('地址 <strong>%s</strong> 删除成功！', up.position),
                });
            } else {
                return res.status(500).json({
                    code: 'ERR',
                    msg: '地址删除失败'
                });
            };
        })
    }
    //mobile api
    //A. Position api
var card_position_4_m = function(req, res) {
        var client = req.user.client.id;
        CardPosition.find({
            client: client
        }).exec(function(err, result) {
            if (err) {
                return res.json({
                    code: 'ERR',
                    msg: '内部服务器错误!'
                })
            }
            if (result) {
                var pos_arr = [];
                _.each(result, function(temp) {
                    var obj = {
                        pos: temp.position,
                        lng: temp.longitude,
                        lat: temp.latitude
                    }
                    pos_arr.push(obj);
                })
                return res.json(pos_arr);
            } else {
                return res.json({
                    code: 'ERR',
                    msg: 'no data for u!'
                })
            }
        })
    }
    //B.save card_data to cardrecord table
var card_record_data_save = function(req, res) {
        var client = req.user.client.id;
        var people = req.query.people || req.user.people.id;
        //签到日期
        var card_time = req.query.card_time || format(new Date());
        //上班签到
        var come_time = req.query.come_time || null;
        //下班签到
        var leave_time = req.query.leave_time || null;
        CardRecord.findOne({
            client: client,
            people: people
        }).exec(function(err, result) {
            if (err) {
                return res.json({
                    code: 'ERR',
                    msg: '内部服务器错误'
                })
            }
            if (result) {
                var single_record = _.find(result.record_data, function(r) {
                    return r.card_time == String(card_time) && which_sign_style == 'M'
                })
                if (single_record) {
                    single_record.card_time = card_time;
                    single_record.come_time = come_time;
                    single_record.leave_time = leave_time;
                    single_record.which_sign_style = 'M';
                    single_record.come.push({
                        come_time: come_time,
                        state: true
                    });
                    single_record.leave.push({
                        leave_time: leave_time,
                        state: true
                    });

                } else {
                    var obj = {
                        card_time: card_time,
                        come_time: come_time,
                        leave_time: leave_time,
                        which_sign_style: 'M'
                    }
                    obj.come = [], obj.leave = [];
                    obj.come.push({
                        come_time: come_time,
                        state: true
                    });
                    obj.leave.push({
                        leave_time: leave_time,
                        state: true
                    });
                    result.record_data.push(obj);
                }
                result.save();
            } else {
                var create_data = {
                    client: client,
                    people: people
                }
                create_data.record_data = [];
                var obj = {
                    card_time: card_time,
                    come_time: come_time,
                    leave_time: leave_time,
                    which_sign_style: 'M'
                }
                obj.come = [], obj.leave = [];
                obj.come.push({
                    come_time: come_time,
                    state: true
                });
                obj.leave.push({
                    leave_time: leave_time,
                    state: true
                });
                create_data.record_data.push(obj);
                CardRecord.create(create_data);
            }
        })
    }
    //C.api for mobile clockin_out
    // var cardrecord_api_callback = function(data,cb){
    //     var people = data.people,
    //     card_time = data.card_time,
    //     come_time= data.come_time||null,
    //     leave_time = data.leave_time||null,
    //     position = 

// }
function format(date) {
    return moment(date).format("YYYY-MM-DD")
}

function get_pep_work_time(people_id) {
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

}
var card_position_add_save = function(req, res) {
    var client = req.user.client.id;
    var pos_arr = JSON.parse(req.body.pos_arr);
    // console.log(pos_arr);
    async.times(pos_arr.length, function(n, next) {
        var single_pos = pos_arr[n];
        var create_data = {
            client: client,
            position_id: single_pos.position_id ? single_pos.position_id : null,
            position_type: single_pos.position_type ? single_pos.position_type : null,
            position: single_pos.position ? single_pos.position : null
        }
        CardPosition.findOne({
            client: client,
            position_id: single_pos.position_id
        }).exec(function(err, result) {
            if (err) {
                next(err, null)
            } else {
                if (result) {
                    result.save(next);
                } else {
                    CardPosition.create(create_data, next)
                }
            }
        })
    }, function(err, data) {
        if (err) {
            return res.json({
                code: 'ERR',
                msg: '内部服务器错误'
            })
        }
        if (data) {
            return res.json({
                code: 'OK',
                msg: '数据发送成功！'
            })
        }

    })
}
var card_position_edit = function(req, res) {
    var client = req.user.client.id;
    var up_id = req.params.up_id;
    var render_data = {
        title: '打卡地点-编辑',
        user: req.user,
        _: us,
        moment: moment
    };
    CardPosition.findById(up_id).exec(function(err, result) {
        if (err) {
            return res.json({
                code: 'ERR',
                msg: '内部服务器错误'
            })
        } else {
            if (result) {
                render_data.result = result;
                res.render('admin/tm/cardposition/edit', render_data)
            } else {
                return res.json({
                    code: 'ERR',
                    msg: '没有找到数据!'
                })
            }
        }

    })
}
var pep_card_position_list = function(req, res) {
        var client = req.user.client.id;
        var render_data = {
            title: '人员考勤地址-配置',
            user: req.user,
            _: us,
            moment: moment
        };
        async.parallel({
            pep: function(cb) {
                People.find({
                    client: client
                }).select('_id people_no').exec(cb)
            }
        }, function(err, result) {
            var pep = result.pep ? result.pep : '';
            async.times(pep.length, function(n, next) {
                var people = pep[n];
                PeopleCardPosition.findOne({
                    client: client,
                    people: people._id
                }).exec(function(err, data) {
                    if (err) {
                        next(err, null)
                    } else {
                        if (data) {
                            next(null, data);
                        } else {
                            var create_data = {
                                client: client,
                                people: people._id
                            }
                            PeopleCardPosition.create(create_data, next);
                        }
                    }
                })
            }, function(err, result) {
                if (err) {
                    return res.json({
                        code: 'ERR',
                        msg: '内部服务器错误'
                    })
                }
                if (result) {
                    PeopleCardPosition.find({
                        client: client
                    }).populate({
                        'path': 'people',
                        'select': '_id people_no people_name company_name position_name'
                    }).exec(function(err, data) {
                        if (err) {
                            return res.json({
                                code: 'ERR',
                                msg: '内部服务器错误'
                            })
                        }
                        if (data) {
                            render_data.pep_data = data;

                            var temp_data = _.find(data, function(temp) {
                                return temp.location_data.length > 0
                            })
                            res.render('admin/tm/cardposition/pep_card_position', render_data)
                        }
                    })
                }
            })
        })
    }
    //人员考勤地点批量配置
var pep_card_position_batch = function(req, res) {
    var render_data = {
        title: '人员考勤地址-批量配置',
        user: req.user,
        _: us,
        moment: moment
    };
    res.render('admin/tm/cardposition/pep_card_position_batch', render_data)
}
var card_position_help_json = function(req, res) {
    var client = req.user.client;
    var c_type = req.params.c_type;
    var cond = {
        client: client
    };
    if (c_type == 'c') {
        cond.location_data = [];
    } else {
        cond.location_data = {
            $ne: []
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
                    PeopleCardPosition.find(cond).populate({
                        'path': 'people',
                        'select': '_id position'
                    }).exec(function(err, positions) {
                        if (positions.length > 0) {
                            var pps = [];
                            us.each(positions, function(s) {
                                if (s.people.position) {
                                    pps.push(String(s.people.position))

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
var location_tree_help_json = function(req, res) {
    var client = req.user.client.id;
    async.waterfall([

        function(cb) {
            async.parallel({
                locations: function(cb) {
                    CardPosition.find({
                        client: client
                    }).exec(cb);
                },
            }, cb);
        },
        function(dc, cb) {
            var ret_data = [];
            var company_label = '<span class="label label-warning" style="padding:1px;">%s</span>';
            var ou_label = '<span class="label label-info" style="padding:1px;">%s</span>';

            _.each(dc.locations, function(x) {
                if (x.position_type == 'C') {
                    var row_c = {
                        'id': x._id,
                        'pId': null,
                        'name': sprintf(company_label, x.position),
                        'type': 'p',
                        'position': x.position,
                        'code': x.position_type,
                    }
                } else {
                    var row_c = {
                        'id': x._id,
                        'pId': null,
                        'name': sprintf(ou_label, x.position),
                        'type': 'p',
                        'position': x.position,
                        'code': x.position_type,
                    }
                }

                ret_data.push(row_c);
                _.each(x.address_arr, function(o) {
                    if (o) { //属于公司下的
                        var row_o = {
                            'id': o._id,
                            'name': o.address,
                            'type': 'a',
                            'lng': o.longitude,
                            'lat': o.latitude,
                            'radius': o.radius,
                            'position': x._id,
                            'pId': x._id
                        };
                        ret_data.push(row_o);
                    };
                })
            })

            cb(null, ret_data);
        }
    ], function(err, result) {

        res.send(result);
    })
}
var card_position_get_data = function(req, res) {
    var client = req.user.client.id;
    var location_data = JSON.parse(req.body.location_data);
    var pps = JSON.parse(req.body.pps);
    var type = req.body.type;
    var msg = '配置成功！！';
    var msg_c = '配置失败！！';
    if (type == 'u') {
        msg = '修改成功！！';
        msg_c = '修改失败！！';
    };

    var temp_data = [];
    var key_location_data = _.keys(location_data);
    _.each(key_location_data, function(temp) {
        var obj = {
            cardposition: temp,
            address_arr: location_data[String(temp)]
        }
        temp_data.push(obj);
    });
    PeopleCardPosition.find({
        client: client
    }).populate({
        'path': 'people',
        'select': '_id position'
    }).exec(function(err, result) {
        if (result) {
            async.times(pps.length, function(n, next) {
                var filter_result = _.filter(result, function(temp) {
                    if (temp.people.position) {
                        return temp.people.position == String(pps[n])
                    }
                })
                if (filter_result.length > 0) {
                    async.times(filter_result.length, function(n, next) {
                        var res = filter_result[n];
                        res.location_data = temp_data;
                        res.save(next)
                    }, next)
                } else {
                    next(null, null)
                }
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
        } else {
            res.json({
                code: 'ERR',
                msg: '未找到数据!'
            })
        }

    })

};
var pep_card_position_edit = function(req, res) {
        var card_id = req.params.card_id;
        var render_data = {
            title: '人员考勤地址-编辑',
            user: req.user,
            _: us,
            moment: moment
        };
        PeopleCardPosition.findById(card_id).populate({
            'path': 'people',
            'select': '_id people_name position_name'
        }).exec(function(err, result) {
            render_data.pep_data = result;
            res.render('admin/tm/cardposition/cardposition_edit', render_data)

        })
    }
    //人员已有的考勤地址
var pep_card_position_checked = function(req, res) {
    var client = req.user.client.id;
    var card_id = req.body.card_id;
    PeopleCardPosition.findById(card_id).exec(function(err, result) {
        if (err) {
            return res.json({
                code: 'ERR',
                msg: '内部服务器错误!'
            })
        }
        if (result) {
            var temp_arr = [],
                name_arr = [];
            _.each(result.location_data, function(temp) {
                temp_arr.push(temp.cardposition);
                _.each(temp.address_arr, function(a) {
                    name_arr.push(a.address)
                })
            })
            return res.json({
                code: 'OK',
                temp_arr: temp_arr,
                name_arr: name_arr
            })
        }
    })
}
var pep_card_position_edit_save = function(req, res) {
    var client = req.user.client.id;
    var card_id = req.body.card_id;
    var location_data = JSON.parse(req.body.location_data);
    var temp_data = [];
    var key_location_data = _.keys(location_data);
    _.each(key_location_data, function(temp) {
        var obj = {
            cardposition: temp,
            address_arr: location_data[String(temp)]
        }
        temp_data.push(obj);
    });
    PeopleCardPosition.findById(card_id).exec(function(err, result) {
        if (err) {
            return res.json({
                code: 'ERR',
                msg: '内部服务器错误!'
            })
        }
        if (result) {
            result.location_data = temp_data;
            result.save();
            return res.json({
                code: 'OK',
                msg: '数据更新成功'
            })
        }
    })
}
var pep_card_position_del = function(req, res) {
    var client = req.user.client.id;
    var card_id = req.body.pep_id;
    PeopleCardPosition.findById(card_id).exec(function(err, result) {
        if (err) {
            return res.json({
                code: 'ERR',
                msg: '内部服务器错误!'
            })
        }
        if (result) {
            result.location_data = [];
            result.save();
            return res.json({
                code: 'OK',
                msg: '数据删除成功'
            })
        }
    })
}
module.exports = function(app, checkAuth) {
    var __base_path = '/admin/tm/cardposition';
    app.get(__base_path + '/form', checkAuth, card_position_form);
    app.get(__base_path + '/list', checkAuth, card_position_list); //列表
    app.get(__base_path + '/get_company_data', checkAuth, get_company_data); //列表
    app.post(__base_path + '/save', checkAuth, card_position_save); //列表
    //
    app.get(__base_path + '/bb', checkAuth, card_position_bb_list); //列表
    app.put(__base_path + '/bb/:sc_id', checkAuth, card_position_update); //更新的保存

    app.get(__base_path + '/bb/:up_id', checkAuth, card_position_fetch); //获取
    app.delete(__base_path + '/bb/:up_id', checkAuth, card_position_bb_delete); //删除
    app.get(__base_path + '/position_4m', checkAuth, card_position_4_m); //删除
    app.post(__base_path + '/save_card_data_4m', checkAuth, card_record_data_save); //删除
    app.post(__base_path + '/add', checkAuth, card_position_add_save); //删除
    app.get(__base_path + '/edit/:up_id', checkAuth, card_position_edit); //删除
    //人员考勤地点配置
    app.get(__base_path + '/location_list', checkAuth, pep_card_position_list); //删除
    app.get(__base_path + '/location_batch', checkAuth, pep_card_position_batch); //删除
    app.get(__base_path + '/card_position_help_json/:c_type', checkAuth, card_position_help_json);

    app.get(__base_path + '/location_tree_help_json', checkAuth, location_tree_help_json);

    app.post(__base_path + '/card_position_get_data', checkAuth, card_position_get_data);
    app.get(__base_path + '/location_edit/:card_id', checkAuth, pep_card_position_edit);
    app.post(__base_path + '/get_checked_location', checkAuth, pep_card_position_checked);
    app.post(__base_path + '/location_edit', checkAuth, pep_card_position_edit_save);
    app.post(__base_path + '/del_location', checkAuth, pep_card_position_del);

}

////op->in:上班 out:下班
var clockInOut = function(client, people, op, date, address_name, longitude, latitude, distance, cb) {
var come_time = null,
    leave_time = null,
    card_time = format(date),
    err_info = null, //返回错误提示信息
    ok_info = 'OK',
    ok_data = null; //返回成功提示信息
async.parallel({
        //人员工作时间
        pep_work_time: function(cb) {
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
                    cb(null, null)
                } else {
                    var cal = result.pep_calendar ? result.pep_calendar : '';
                    var pep_data = result.work_plan ? result.work_plan : '';
                    var time = result.time ? result.time : '';
                    var work_time = null;
                    if (cal) {
                        var calendar_data = cal.calendar_data;
                        var single_calendar_data = _.find(calendar_data, function(temp) {
                            return temp.job_date == String(card_time)
                        })
                        if (single_calendar_data) {
                            work_time = _.find(time, function(temp) {
                                return temp._id == String(single_calendar_data.work_time)
                            })
                        }
                    } else {
                        var single_work_plan = _.find(pep_data.tm_work_plan, function(temp) {
                            return moment(new Date()).isBefore(temp.expire_off) && moment(new Date()).isAfter(temp.expire_on)
                        });
                        if (single_work_plan) {
                            if (single_work_plan.calendar_data) {
                                var calendar_data = single_work_plan.calendar_data;
                                var single_calendar_data = _.find(calendar_data, function(temp) {
                                    return temp.job_date == String(card_time)
                                })
                                if (single_calendar_data) {
                                    work_time = _.find(time, function(temp) {
                                        return temp._id == String(single_calendar_data.work_time)
                                    })
                                }
                            } else {
                                work_time = _.find(time, function(temp) {
                                    return temp._id == String(single_work_plan.work_time)
                                })
                            }


                        }
                    }

                    cb(null, work_time)
                }

            })
        }, //判断人员的打卡数据
    }, function(err, result) {
        if (err) {
            err_info = '服务器错误!';
            cb(err_info, {
                msg: ok_info,
                data: ok_data
            })
        }
        if (result) {
            //人员工作时间
            var pep_work_time = result.work_time ? result.work_time : '';
            // //人员打卡数据
            // var pep_record_data = result.pep_record_data ? result.pep_record_data : '';


            if (op == 'in') { //签到
                come_time = new Date();
                if (pep_work_time) { //找到了人员工作时间
                    var sign_on_time = pep_work_time.sign_on_time ? pep_work_time.sign_on_time : '';
                    if (sign_on_time) {
                        if (format3(format2(come_time)) > format3(sign_on_time)) { //签到开始时间之后
                            save_card_data(client, people, op, card_time, come_time, leave_time, address_name, longitude, latitude, distance, function(err, data) {
                                if (err) {
                                    cb(err, {
                                        msg: ok_info,
                                        data: ok_data
                                    })
                                } else {
                                    if (data.err_info) {
                                        err_info = data.err_info;
                                    }
                                    if (data.ok_info) {
                                        ok_info = data.ok_info.info;
                                        ok_data = data.ok_info.data;
                                    }
                                    cb(err_info, {
                                        msg: ok_info,
                                        data: ok_data
                                    })
                                }

                            })

                        } else {
                            err_info = '亲,签到开始时间还未到额';
                            cb(err_info, {
                                msg: ok_info,
                                data: ok_data
                            })
                        }
                    } else {
                        save_card_data(client, people, op, card_time, come_time, leave_time, address_name, longitude, latitude, distance, function(err, data) {
                            if (err) {
                                cb(err, {
                                    msg: ok_info,
                                    data: ok_data
                                })
                            } else {
                                if (data.err_info) {
                                    err_info = data.err_info;
                                }
                                if (data.ok_info) {
                                    ok_info = data.ok_info.info;
                                    ok_data = data.ok_info.data;
                                }
                                cb(err_info, {
                                    msg: ok_info,
                                    data: ok_data
                                })
                            }

                        })


                    }
                } else { //没有找到人员工作时间
                    save_card_data(client, people, op, card_time, come_time, leave_time, address_name, longitude, latitude, distance, function(err, data) {
                        if (err) {
                            cb(err, {
                                msg: ok_info,
                                data: ok_data
                            })
                        } else {
                            if (data.err_info) {
                                err_info = data.err_info;
                            }
                            if (data.ok_info) {
                                ok_info = data.ok_info.info;
                                ok_data = data.ok_info.data;
                            }
                            cb(err_info, {
                                msg: ok_info,
                                data: ok_data
                            })
                        }

                    })

                }
            } else if (op == 'out') { //签退
                leave_time = new Date();
                if (pep_work_time) {
                    var sign_off_end_time = pep_work_time.sign_off_end_time ? pep_work_time.sign_off_end_time : '';
                    var is_cross_day = pep_work_time.is_cross_day; //是否跨天
                    if (sign_off_end_time) {

                        if (format3(format2(leave_time)) < format3(sign_off_end_time)) { //结束时间
                            save_card_data(client, people, op, card_time, come_time, leave_time, address_name, longitude, latitude, distance, function(err, data) {
                                if (err) {
                                    cb(err, {
                                        msg: ok_info,
                                        data: ok_data
                                    })
                                } else {
                                    if (data.err_info) {
                                        err_info = data.err_info;
                                    }
                                    if (data.ok_info) {
                                        ok_info = data.ok_info.info;
                                        ok_data = data.ok_info.data;
                                    }
                                    cb(err_info, {
                                        msg: ok_info,
                                        data: ok_data
                                    })
                                }

                            })

                        } else {
                            err_info = '亲,签退结束时间已到，不能再签退了!';
                            cb(err_info, {
                                msg: ok_info
                            })
                        }

                    } else {
                        if (is_cross_day) {
                            if (format3(pep_work_time.work_on_time) > format3(format2(leave_time))) {
                                //打到前一天
                                card_time = moment().subtract('days', 1).format("YYYY-MM-DD");
                                save_card_data(client, people, op, card_time, come_time, leave_time, address_name, longitude, latitude, distance, function(err, data) {
                                    if (err) {
                                        cb(err, {
                                            msg: ok_info,
                                            data: ok_data
                                        })
                                    } else {
                                        if (data.err_info) {
                                            err_info = data.err_info;
                                        }
                                        if (data.ok_info) {
                                            ok_info = data.ok_info.info;
                                            ok_data = data.ok_info.data;
                                        }
                                        cb(err_info, {
                                            msg: ok_info,
                                            data: ok_data
                                        })
                                    }

                                })

                            } else {
                                //打到当天
                                save_card_data(client, people, op, card_time, come_time, leave_time, address_name, longitude, latitude, distance, function(err, data) {
                                    if (err) {
                                        cb(err, {
                                            msg: ok_info,
                                            data: ok_data
                                        })
                                    } else {
                                        if (data.err_info) {
                                            err_info = data.err_info;
                                        }
                                        if (data.ok_info) {
                                            ok_info = data.ok_info.info;
                                            ok_data = data.ok_info.data;
                                        }
                                        cb(err_info, {
                                            msg: ok_info,
                                            data: ok_data
                                        })
                                    }

                                })

                            }
                        }
                    }

                } else {
                    save_card_data(client, people, op, card_time, come_time, leave_time, address_name, longitude, latitude, distance, function(err, data) {
                        if (err) {
                            cb(err, {
                                msg: ok_info,
                                data: ok_data
                            })
                        } else {
                            if (data.err_info) {
                                err_info = data.err_info;
                            }
                            if (data.ok_info) {
                                ok_info = data.ok_info.info;
                                ok_data = data.ok_info.data;
                            }
                            cb(err_info, {
                                msg: ok_info,
                                data: ok_data
                            })
                        }

                    })


        }
    } else {
        err_info = '未找到上下班打卡数据'
        cb(err_info, {
            msg: ok_info
        })
    }
} else {
    err_info = '没有找到数据!';
    cb(err_info, {
        msg: ok_info
    })
}
})


};
//考勤地点配置
var clockInOutLocation = function(client, people, cb) {
    async.waterfall([

        function(cb) {
            PeopleCardPosition.findOne({
                client: client,
                people: people
            }).populate('location_data.cardposition').exec(function(err, result) {
                if (err) {
                    cb('内部服务器错误!', null);
                } else {
                    if (result) {
                        if (result.location_data.length > 0) {
                            var arr = [];
                            _.each(result.location_data, function(temp) {
                                if (temp.address_arr.length > 0) {
                                    _.each(temp.address_arr, function(a) {
                                        var obj = {
                                            position: temp.cardposition.position,
                                            longitude: a.longitude ? a.longitude : null,
                                            latitude: a.latitude ? a.latitude : null,
                                            radius: a.radius ? a.radius : 100
                                        };
                                        arr.push(obj);
                                    })
                                }

                            })
                            cb(null, arr);

                        } else {
                            cb(null, null)
                        }
                    } else {
                        cb(null, null)
                    }
                }
            })
        }
    ], function(err, result) {
        if (err) {
            cb('内部服务器错误!', null)
        } else {
            if (result) {
                if (result.length > 0) {
                    cb(null, result)
                } else {
                    cb(null, null);
                }

            } else {
                CardPosition.find({
                    client: client
                }).exec(function(err, data) {
                    if (err) {
                        cb('内部服务器错误!', null)
                    } else {
                        var arr = [];
                        if (data.length > 0) {
                            _.each(data, function(temp) {
                                if (temp.address_arr.length > 0) {
                                    _.each(temp.address_arr, function(a) {
                                        var obj = {
                                            position: temp.position,
                                            longitude: a.longitude ? a.longitude : null,
                                            latitude: a.latitude ? a.latitude : null,
                                            radius: a.radius ? a.radius : 100
                                        };
                                        arr.push(obj);

                                    })
                                }
                            })
                            cb(null, arr);
                        } else {
                            cb(null, [])
                        }

                    }
                })
            }
        }
    })
}

function format2(date) {
    return moment(date).format("HH:mm")
}

function format3(date) {
    return moment.duration(date)
}

function save_card_data(client, people, op, card_time, come_time, leave_time, address_name, longitude, latitude, distance, cb) {
    var err_info = null,
        ok_info = null;
    CardRecord.findOne({
        client: client,
        people: people
    }).exec(function(err, pep_record_data) {
        if (err) {
            cb(null, null)
        }
        if (pep_record_data) {
            var single_record = _.find(pep_record_data.record_data, function(r) {
                return r.card_time == String(card_time) && r.which_sign_style == 'M'
            })
            if (single_record) {
                //打卡次数不能超过三次
                if ((op == 'in' && single_record.come.length == 1) || (op == 'out' && single_record.leave.length == 2)) {
                    err_info = '你已打成功，无需再次打卡!';
                    //返回打卡记录数据
                    if (op == 'in') {
                        ok_info = {
                            info: '签到成功!',
                            data: single_record.come
                        }
                        // ok_info = '签到成功!'

                    } else {
                        ok_info = {
                            info: '签退成功!',
                            data: single_record.leave
                        }

                        // ok_info = '签退成功!'
                    }

                    // if (op == 'in') {
                    //     ok_info = single_record.come;
                    // }
                    // if (op == 'out') {
                    //     ok_info = single_record.leave;
                    // }
                    cb(null, {
                        err_info: err_info ? err_info : null,
                        ok_info: ok_info ? ok_info : null
                    })
                } else {
                    single_record.card_time = card_time;
                    if (op == 'in') {
                        single_record.come_time = come_time;
                        single_record.come.push({
                            come_time: come_time,
                            state: true
                        });
                    }
                    if (op == 'out') {
                        single_record.leave_time = leave_time;
                        single_record.leave.push({
                            leave_time: leave_time,
                            state: true
                        });

                    }

                    single_record.which_sign_style = 'M';
                    single_record.position = address_name;
                    single_record.lng = longitude;
                    single_record.lat = latitude;
                    single_record.distance = distance;

                    pep_record_data.save(function(err, data) {
                        if (err) {
                            cb(err, {
                                msg: ok_info
                            })
                        } else {
                            if (op == 'in') {
                                ok_info = {
                                    info: '签到成功!',
                                    data: single_record.come
                                }
                                // ok_info = '签到成功!'

                            } else {
                                ok_info = {
                                    info: '签退成功!',
                                    data: single_record.leave
                                }

                                // ok_info = '签退成功!'
                            }

                            // if (op == 'in') {
                            //     ok_info = '签到成功!'

                            // } else {
                            //     ok_info = '签退成功!'
                            // }
                            cb(null, {
                                err_info: err_info ? err_info : null,
                                ok_info: ok_info ? ok_info : null
                            })

                        }
                    });
                }


            } else {
                var obj = {
                    card_time: card_time,
                    come_time: come_time,
                    leave_time: leave_time,
                    which_sign_style: 'M',
                    position: address_name,
                    lng: longitude,
                    lat: latitude,
                    distance: distance
                }
                obj.come = [], obj.leave = [];
                if (op == 'in') {
                    obj.come.push({
                        come_time: come_time,
                        state: true
                    });
                }
                if (op == 'out') {
                    obj.leave.push({
                        leave_time: leave_time,
                        state: true
                    });
                }

                pep_record_data.record_data.push(obj);
                pep_record_data.save(function(err, data) {
                    if (err) {
                        cb(null, {
                            err_info: err ? err : null,
                            ok_info: ok_info ? ok_info : null
                        })
                    } else {
                        if (op == 'in') {
                            ok_info = {
                                info: '签到成功!',
                                data: obj.come
                            }
                            // ok_info = '签到成功!'

                        } else {
                            ok_info = {
                                info: '签退成功!',
                                data: obj.leave
                            }

                            // ok_info = '签退成功!'
                        }
                        cb(null, {
                            err_info: err_info ? err_info : null,
                            ok_info: ok_info ? ok_info : null
                        })

                    }
                });
            }

        } else {
            var create_data = {
                client: client,
                people: people
            }
            create_data.record_data = [];
            var obj = {
                card_time: card_time,
                come_time: come_time,
                leave_time: leave_time,
                which_sign_style: 'M',
                position: address_name,
                lng: longitude,
                lat: latitude,
                distance: distance

            }
            obj.come = [], obj.leave = [];
            obj.come.push({
                come_time: come_time,
                state: true
            });
            obj.leave.push({
                leave_time: leave_time,
                state: true
            });
            create_data.record_data.push(obj);
            CardRecord.create(create_data, function(err, data) {
                if (err) {
                    cb(null, {
                        err_info: err ? err : null,
                        ok_info: ok_info ? ok_info : null
                    })

                } else {
                    if (op == 'in') {
                        ok_info = '签到成功!'

                    } else {
                        ok_info = '签退成功!'
                    }
                    cb(null, {
                        err_info: err_info ? err_info : null,
                        ok_info: ok_info ? ok_info : null
                    })


                }



            });

        }
    })

}
module.exports.clockInOut = clockInOut;
module.exports.clockInOutLocation = clockInOutLocation;