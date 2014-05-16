var sprintf = require('sprintf').sprintf;
var TalentType = require('../../models/pm').TalentType;
var HoroScope = require('../../models/pm').HoroScope;
var PayrollItemClient = require('../../models/payroll').PayrollItemClient;
var Position = require('../../models/position').Position;
var PAR = require('../../models/pa').PAR;
var TalentPool = require('../../models/pm').TalentPool;
var PAMove = require('../../models/pa').PAMove;
var PAEvent = require('../../models/pa').PAEvent;
var PADemotion = require('../../models/pa').PADemotion;

var PAPromotion = require('../../models/pa').PAPromotion;

var PYAdjustSingle = require('../../models/payroll').PYAdjustSingle;

var ProcessInstance = require('../../models/workflow').ProcessInstance;
var async = require('async');
var moment = require('moment');

var talent_type_bb_form = function(req, res) {
    var i18n = req.i18n;
    var client = req.user.client.id;
    var render_data = {
        title: '人才分类-清单',
        user: req.user,
    };
    async.parallel({
        talent: function(cb) {
            TalentType.find({
                client: client
            }).exec(cb)
        },
        horoscope: function(cb) {
            HoroScope.find({
                client: client
            }).exec(cb)
        }
    }, function(err, result) {
        if (err) {
            return res.json({
                code: 'ERR',
                msg: '内部服务器错误：' + err
            });
        } else {
            var horoscope = [];
            render_data.talent = result.talent;
            _.each(result.talent, function(temp) {
                _.each(temp.horoscope, function(horo) {
                    horoscope.push(String(horo))
                })
            })
            var horo = _.filter(result.horoscope[0].color, function(color) {
                return !~horoscope.indexOf(String(color._id))
            })
            render_data.horoscope = horo;
            render_data.color = result.horoscope[0].color;

            res.render('user/user_report/talent_lambda/list', render_data);
        };
    })
}
var talent_type_bb_list = function(req, res) {
    var i18n = req.i18n;
    var client = req.user.client.id;
    // async.parallel({
    //     talent: function(cb) {
    //         TalentType.find({
    //             client: client
    //         }).exec(cb)
    //     },
    //     horoscope: function(cb) {
    //         HoroScope.find({
    //             client: client
    //         }).exec(cb)
    //     }
    // },function(err, result) {
    //     if (err) {
    //         return res.json({
    //             code: 'ERR',
    //             msg: '内部服务器错误：' + err
    //         });
    //     } else {
    //         return res.json({
    //             talent: result.talent,
    //             horoscope: result.horoscope
    //         });
    //     };
    // })
    TalentType.find({
        client: client
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
var talent_type_bb_fetch = function(req, res) {
    var i18n = req.i18n;
    var up_id = req.params.up_id;
    async.waterfall([

        function(cb) {
            TalentType.findById(up_id).exec(cb);
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
var talent_type_bb_create = function(req, res) {
    var i18n = req.i18n;
    var up_id = req.params.up_id;
    var client = req.user.client.id;
    var data4create = {
        client: client,
        type_name: req.body.type_name,
        type_description: req.body.type_description,
    };
    async.waterfall([

        function(cb) {
            TalentType.create(data4create, cb);
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
                msg: sprintf('人才分类 <strong>%s</strong> 保存成功！', result.type_name),
                _id: result._id,
            });
        } else {
            return res.status(500).json({
                code: 'ERR',
                msg: '人才分类保存失败'
            });
        };
    })
}
var talent_type_bb_update = function(req, res) {
    var i18n = req.i18n;
    var up_id = req.params.up_id;
    async.waterfall([

        function(cb) {
            TalentType.findById(up_id, cb);
        },
        function(up, cb) {
            up.type_name = req.body.type_name;
            up.type_description = req.body.type_description;
            up.horoscope = req.body.horoscope
            up.save(cb);
        }
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
                msg: sprintf('人才分类 <strong>%s</strong> 保存成功！', result.type_name),
                _id: result._id,
            });
        } else {
            return res.status(500).json({
                code: 'ERR',
                msg: '人才分类保存失败'
            });
        };
    })
}
var talent_type_bb_delete = function(req, res) {
    var i18n = req.i18n;
    var up_id = req.params.up_id;
    TalentType.findByIdAndRemove(up_id, function(err, up) {
        if (err) {
            return res.status(500).json({
                code: 'ERR',
                msg: '内部服务器错误：' + err
            });
        };
        if (up) {
            return res.json({
                code: 'OK',
                msg: sprintf('人才分类 <strong>%s</strong> 删除成功！', up.type_name),
            });
        } else {
            return res.status(500).json({
                code: 'ERR',
                msg: '人才分类删除失败'
            });
        };
    })
}

//九宫图data
var horoscope_data = function(req, res) {
    var client = req.user.client.id;
    HoroScope.find({
        client: client
    }).exec(function(err, result) {
        return res.json({
            code: 'OK',
            msg: result[0]
        })
    })
}
var type_input_help = function(req, res) {
    var client = req.user.client.id;
    var i18n = req.i18n;

    async.parallel({
        talent_type: function(cb) {
            TalentType.find({
                client: client
            }).exec(cb)
        },
        payroll_item: function(cb) {
            PayrollItemClient.find({
                client: client
            }).exec(function(err, result) {
                var obj = {};
                _.each(result, function(temp) {
                    obj[temp._id] = temp.pri_name;
                })
                cb(null, obj)
            })
        },
        position: function(cb) {
            Position.find({
                client: client
            }).exec(function(err, result) {
                var obj = {};
                _.each(result, function(temp) {
                    obj[temp._id] = temp.position_name;
                })
                cb(null, obj)

            })
        },
        par: function(cb) {
            PAR.find({
                client: client
            }).exec(function(err, result) {
                var obj = {};
                _.each(result, function(temp) {
                    obj[temp._id] = temp.pa_reason_name[i18n.lng()];
                })
                cb(null, obj)

            })
        },
        pa_move: function(cb) {
            PAMove.find({
                client: client
            }).populate('people src_position dest_position par').exec(cb)
        },
        pa_demotion: function(cb) {
            PADemotion.find({
                client: client
            }).populate('people src_position dest_position par').exec(cb)
        },
        pa_promotion: function(cb) {
            PAPromotion.find({
                client: client
            }).populate('people src_position dest_position par').exec(cb)
        },
        py_adjust: function(cb) {
            PYAdjustSingle.find({
                client: client
            }).populate('people').exec(cb)
        },
        pa_event: function(cb) {
            PAEvent.find({
                client: client
            }).populate('pa_event pa_reason people position psr esg').exec(cb)
        },
        process_instance: function(cb) {
            ProcessInstance.find({
                client: client,
                process_state: 'END'
            }).populate('start_user').exec(cb)
        }
    }, function(err, result) {
        return res.json({
            code: 'OK',
            msg: result
        })
    })
}

//人才池运行程序
// var talent_pool_run = function(req,res){

// }
var lambda_panel = function(req, res) {
    var i18n = req.i18n;
    var client = req.user.client.id;
    var render_data = {
        title: '人才盘点',
        user: req.user,
    };
    res.render('user/user_report/talent_lambda/panel', render_data)

}
var people_input_help = function(req, res) {
    var user = req.user;
    var client = req.user.client;
    async.waterfall([

        function(cb) {
            async.parallel({
                tp: function(cb) {
                    TalentPool.find({
                        client: client,
                        history: false
                    }).populate('people talent_lambda').exec(cb)
                },
                tt: function(cb) {
                    TalentType.find({
                        client: client
                    }).exec(cb)
                },
                pos: function(cb) {
                    Position.find({
                        client: client
                    }).exec(cb)
                }
            }, cb)

        },
        function(talent, cb) {
            var ret_data = [];
            _.each(talent.tt, function(t) {
                var row = {
                    'id': t._id,
                    'pId': null,
                    'name': t.type_name,
                    'type': 'c'
                };
                ret_data.push(row);
                var filter_type = _.filter(talent.tp, function(temp) {
                    return !temp.history
                })
                filter_type = _.sortBy(filter_type, function(temp) {
                    return moment(temp.talent_lambda.validFrom).format('yyyymmdd')
                })
                var lambda_group = _.groupBy(filter_type, function(temp) {
                    return temp.people._id
                })
                var lambda = _.values(lambda_group)
                var item = [];
                _.each(lambda, function(temp) {
                    item.push(temp.pop())
                })
                item = _.filter(item, function(temp) {
                    return _.isEqual(String(temp.talent_type), String(t._id))
                })
                _.each(item, function(p) {
                    var pos_filter = _.find(talent.pos, function(po) {
                        return _.isEqual(String(po._id), String(p.people.position))
                    })
                    var row = {
                        'id': p.people._id,
                        'pId': t._id,
                        'lambda': p.talent_lambda._id,
                        'name': p.people.people_name,
                        'type': 'p',
                        'is_key': pos_filter.is_key,
                        'position_manager': pos_filter.position_manager
                    }
                    ret_data.push(row)
                })
            })
            cb(null, ret_data);
        }
    ], function(err, result) {
        res.send(result)
    })
}
module.exports = function(app, checkAuth) {
    var __base_path = '/admin/pm/talent_type';
    app.get(__base_path + '/bbform', checkAuth, talent_type_bb_form);
    app.get(__base_path + '/bb', checkAuth, talent_type_bb_list); //列表
    app.get(__base_path + '/bb/:up_id', checkAuth, talent_type_bb_fetch); //获取
    app.post(__base_path + '/bb/:up_id', checkAuth, talent_type_bb_create); //新建的保存
    app.put(__base_path + '/bb/:up_id', checkAuth, talent_type_bb_update); //更新的保存
    app.delete(__base_path + '/bb/:up_id', checkAuth, talent_type_bb_delete); //删除
    app.get(__base_path + '/horoscope', checkAuth, horoscope_data);
    app.get(__base_path + '/type_input_help', checkAuth, type_input_help);
    // app.get(__base_path + '/run_talent_pool', checkAuth, talent_pool_run);
    app.get(__base_path + '/panel', checkAuth, lambda_panel);
    app.get(__base_path + '/people_input_help_json', checkAuth, people_input_help);



}
