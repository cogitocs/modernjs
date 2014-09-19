var sprintf = require('sprintf').sprintf;
var DevelopeType = require('../../models/pm').DevelopeType;
var DevelopeStyle = require('../../models/pm').DevelopeStyle;
var DevelopeDirect = require('../../models/pm').DevelopeDirect;
var DevelopePlan = require('../../models/pm').DevelopePlan;
var DevelopeList = require('../../models/pm').DevelopeList;
var DevelopeListConfig = require('../../models/pm').DevelopeListConfig;

var People = require('../../models/people').People;

var LearnStyle = require('../../models/pm').LearnStyle;
var CheckStyle = require('../../models/pm').CheckStyle;
var PayrollItemClient = require('../../models/payroll').PayrollItemClient;
var Position = require('../../models/position').Position;
var PAR = require('../../models/pa').PAR;
var TalentPool = require('../../models/pm').TalentPool;
var async = require('async');
var moment = require('moment');

//人才培养类别
var develope_type_bb_form = function(req, res) {
    var i18n = req.i18n;
    var client = req.user.client.id;
    var render_data = {
        title: '人才培养类别--配置',
        user: req.user,
    };
    async.parallel({
        type: function(cb) {
            DevelopeType.find({
                client: client
            }).exec(cb)
        },
        style: function(cb) {
            DevelopeStyle.find({
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
            var styles = [];
            render_data.type = result.type;
            _.each(result.type, function(temp) {
                _.each(temp.develope_style, function(style) {
                    styles.push(String(style))
                })
            })
            var sty = _.filter(result.style, function(style) {
                return !~styles.indexOf(String(style._id))
            })
            render_data.style = sty;
            render_data.develope_style = result.style;
            res.render('user/user_report/talent_develope/type_list', render_data);
        };
    })
}
var develope_type_bbform = function(req, res) {
    var i18n = req.i18n;
    var client = req.user.client.id;
    var render_data = {
        title: '人才培养方式--配置',
        user: req.user,
    };
    var up_id = req.query.up_id;

    DevelopeType.findById(up_id).exec(function(err, result) {
        if (err) {
            return res.json({
                code: 'ERR',
                msg: '内部服务器错误：' + err
            });
        } else {
            render_data.result = result;
            res.render('user/user_report/talent_develope/type_form', render_data);
        };
    })
}
var develope_type_bb_list = function(req, res) {
    var i18n = req.i18n;
    var client = req.user.client.id;
    DevelopeType.find({
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
var develope_type_bb_fetch = function(req, res) {
    var i18n = req.i18n;
    var up_id = req.params.up_id;
    async.waterfall([

        function(cb) {
            DevelopeType.findById(up_id).exec(cb);
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
var develope_type_bb_create = function(req, res) {
    var i18n = req.i18n;
    var up_id = req.params.up_id;
    var client = req.user.client.id;
    var data4create = {
        client: client,
        type_name: req.body.type_name,
    };
    async.waterfall([

        function(cb) {
            DevelopeType.create(data4create, cb);
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
                msg: sprintf('人才培养类别 <strong>%s</strong> 保存成功！', result.type_name),
                _id: result._id,
            });
        } else {
            return res.status(500).json({
                code: 'ERR',
                msg: '人才培养类别保存失败'
            });
        };
    })
}
var develope_type_bb_update = function(req, res) {
    var i18n = req.i18n;
    var up_id = req.params.up_id;
    async.waterfall([

        function(cb) {
            DevelopeType.findById(up_id, cb);
        },
        function(up, cb) {
            up.type_name = req.body.type_name;
            up.type_description = req.body.type_description;
            up.develope_style = req.body.develope_style;
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
                msg: sprintf('人才培养类别 <strong>%s</strong> 保存成功！', result.type_name),
                _id: result._id,
            });
        } else {
            return res.status(500).json({
                code: 'ERR',
                msg: '人才培养类别保存失败'
            });
        };
    })
}
var develope_type_bb_delete = function(req, res) {
        var i18n = req.i18n;
        var up_id = req.params.up_id;
        DevelopeType.findByIdAndRemove(up_id, function(err, up) {
            if (err) {
                return res.status(500).json({
                    code: 'ERR',
                    msg: '内部服务器错误：' + err
                });
            };
            if (up) {
                return res.json({
                    code: 'OK',
                    msg: sprintf('人才培养类别 <strong>%s</strong> 删除成功！', up.type_name),
                });
            } else {
                return res.status(500).json({
                    code: 'ERR',
                    msg: '人才培养类别删除失败'
                });
            };
        })
    }
    //培养方式
    // var talent_type_bb_form = function(req, res) {
    //     var i18n = req.i18n;
    //     var client = req.user.client.id;
    //     var render_data = {
    //         title: '培养方式--配置',
    //         user: req.user,
    //     };
    //     res.render('user/user_report/talent_develope/list', render_data);
    // }
    // var talent_type_bb_list = function(req, res) {
    //     var i18n = req.i18n;
    //     var client = req.user.client.id;
    //     DevelopeStyle.find({
    //         client: client
    //     }).exec(function(err, result) {
    //         if (err) {
    //             return res.json({
    //                 code: 'ERR',
    //                 msg: '内部服务器错误：' + err
    //             });
    //         } else {
    //             return res.json(result);
    //         };
    //     })
    // }
    // var talent_type_bb_fetch = function(req, res) {
    //     var i18n = req.i18n;
    //     var up_id = req.params.up_id;
    //     async.waterfall([

//         function(cb) {
//             DevelopeStyle.findById(up_id).exec(cb);
//         },
//     ], function(err, result) {
//         if (err) {
//             return res.json({
//                 code: 'ERR',
//                 msg: '内部服务器错误：' + err
//             });
//         } else {
//             return res.json(result);
//         };
//     })
// }
// var talent_type_bb_create = function(req, res) {
//     var i18n = req.i18n;
//     var up_id = req.params.up_id;
//     var client = req.user.client.id;
//     var data4create = {
//         client: client,
//         type_name: req.body.type_name,
//     };
//     async.waterfall([

//         function(cb) {
//             DevelopeStyle.create(data4create, cb);
//         },
//     ], function(err, result) {
//         if (err) {
//             return res.status(500).json({
//                 code: 'ERR',
//                 msg: '内部服务器错误：' + err
//             });
//         };
//         if (result) {
//             return res.json({
//                 code: 'OK',
//                 msg: sprintf('人才培养方式 <strong>%s</strong> 保存成功！', result.type_name),
//                 _id: result._id,
//             });
//         } else {
//             return res.status(500).json({
//                 code: 'ERR',
//                 msg: '人才培养方式保存失败'
//             });
//         };
//     })
// }
// var talent_type_bb_update = function(req, res) {
//     var i18n = req.i18n;
//     var up_id = req.params.up_id;
//     async.waterfall([

//         function(cb) {
//             DevelopeStyle.findById(up_id, cb);
//         },
//         function(up, cb) {
//             up.type_name = req.body.type_name;
//             up.type_description = req.body.type_description;
//             up.save(cb);
//         }
//     ], function(err, result) {
//         if (err) {
//             return res.status(500).json({
//                 code: 'ERR',
//                 msg: '内部服务器错误：' + err
//             });
//         };
//         if (result) {
//             return res.json({
//                 code: 'OK',
//                 msg: sprintf('人才培养方式 <strong>%s</strong> 保存成功！', result.type_name),
//                 _id: result._id,
//             });
//         } else {
//             return res.status(500).json({
//                 code: 'ERR',
//                 msg: '人才培养方式保存失败'
//             });
//         };
//     })
// }
// var talent_type_bb_delete = function(req, res) {
//     var i18n = req.i18n;
//     var up_id = req.params.up_id;
//     DevelopeStyle.findByIdAndRemove(up_id, function(err, up) {
//         if (err) {
//             return res.status(500).json({
//                 code: 'ERR',
//                 msg: '内部服务器错误：' + err
//             });
//         };
//         if (up) {
//             return res.json({
//                 code: 'OK',
//                 msg: sprintf('人才培养方式 <strong>%s</strong> 删除成功！', up.type_name),
//             });
//         } else {
//             return res.status(500).json({
//                 code: 'ERR',
//                 msg: '人才培养方式删除失败'
//             });
//         };
//     })
// }
//安排方式
var learn_style_bb_form = function(req, res) {
    var i18n = req.i18n;
    var client = req.user.client.id;
    var render_data = {
        title: '安排方式--配置',
        user: req.user,
    };
    res.render('user/user_report/talent_develope/list', render_data);
}
var learn_style_bb_list = function(req, res) {
    var i18n = req.i18n;
    var client = req.user.client.id;
    LearnStyle.find({
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
var learn_style_bb_fetch = function(req, res) {
    var i18n = req.i18n;
    var up_id = req.params.up_id;
    async.waterfall([

        function(cb) {
            LearnStyle.findById(up_id).exec(cb);
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
var learn_style_bb_create = function(req, res) {
    var i18n = req.i18n;
    var up_id = req.params.up_id;
    var client = req.user.client.id;
    var data4create = {
        client: client,
        type_name: req.body.type_name,
    };
    async.waterfall([

        function(cb) {
            LearnStyle.create(data4create, cb);
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
                msg: sprintf('安排方式 <strong>%s</strong> 保存成功！', result.type_name),
                _id: result._id,
            });
        } else {
            return res.status(500).json({
                code: 'ERR',
                msg: '安排方式保存失败'
            });
        };
    })
}
var learn_style_bb_update = function(req, res) {
    var i18n = req.i18n;
    var up_id = req.params.up_id;
    async.waterfall([

        function(cb) {
            LearnStyle.findById(up_id, cb);
        },
        function(up, cb) {
            up.type_name = req.body.type_name;
            up.type_description = req.body.type_description;
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
                msg: sprintf('安排方式 <strong>%s</strong> 保存成功！', result.type_name),
                _id: result._id,
            });
        } else {
            return res.status(500).json({
                code: 'ERR',
                msg: '安排方式保存失败'
            });
        };
    })
}
var learn_style_bb_delete = function(req, res) {
        var i18n = req.i18n;
        var up_id = req.params.up_id;
        LearnStyle.findByIdAndRemove(up_id, function(err, up) {
            if (err) {
                return res.status(500).json({
                    code: 'ERR',
                    msg: '内部服务器错误：' + err
                });
            };
            if (up) {
                return res.json({
                    code: 'OK',
                    msg: sprintf('安排方式 <strong>%s</strong> 删除成功！', up.type_name),
                });
            } else {
                return res.status(500).json({
                    code: 'ERR',
                    msg: '安排方式删除失败'
                });
            };
        })
    }
    //评估方式
var check_style_bb_form = function(req, res) {
    var i18n = req.i18n;
    var client = req.user.client.id;
    var render_data = {
        title: '评估方式--配置',
        user: req.user,
    };
    res.render('user/user_report/talent_develope/check_list', render_data);
}
var check_style_bb_list = function(req, res) {
    var i18n = req.i18n;
    var client = req.user.client.id;
    CheckStyle.find({
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
var check_style_bb_fetch = function(req, res) {
    var i18n = req.i18n;
    var up_id = req.params.up_id;
    async.waterfall([

        function(cb) {
            CheckStyle.findById(up_id).exec(cb);
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
var check_style_bb_create = function(req, res) {
    var i18n = req.i18n;
    var up_id = req.params.up_id;
    var client = req.user.client.id;
    var data4create = {
        client: client,
        type_name: req.body.type_name,
    };
    async.waterfall([

        function(cb) {
            CheckStyle.create(data4create, cb);
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
                msg: sprintf('评估方式 <strong>%s</strong> 保存成功！', result.type_name),
                _id: result._id,
            });
        } else {
            return res.status(500).json({
                code: 'ERR',
                msg: '评估方式保存失败'
            });
        };
    })
}
var check_style_bb_update = function(req, res) {
    var i18n = req.i18n;
    var up_id = req.params.up_id;
    async.waterfall([

        function(cb) {
            CheckStyle.findById(up_id, cb);
        },
        function(up, cb) {
            up.type_name = req.body.type_name;
            up.type_description = req.body.type_description;
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
                msg: sprintf('评估方式 <strong>%s</strong> 保存成功！', result.type_name),
                _id: result._id,
            });
        } else {
            return res.status(500).json({
                code: 'ERR',
                msg: '评估方式保存失败'
            });
        };
    })
}
var check_style_bb_delete = function(req, res) {
    var i18n = req.i18n;
    var up_id = req.params.up_id;
    CheckStyle.findByIdAndRemove(up_id, function(err, up) {
        if (err) {
            return res.status(500).json({
                code: 'ERR',
                msg: '内部服务器错误：' + err
            });
        };
        if (up) {
            return res.json({
                code: 'OK',
                msg: sprintf('评估方式 <strong>%s</strong> 删除成功！', up.type_name),
            });
        } else {
            return res.status(500).json({
                code: 'ERR',
                msg: '评估方式删除失败'
            });
        };
    })
}
var develope_panel = function(req, res) {
    var i18n = req.i18n;
    var client = req.user.client.id;
    var render_data = {
        title: '人才培养',
        user: req.user,
    };
    res.render('user/user_report/talent_develope/panel', render_data)

}

//人才培养-清单
// var talent_develope_list = function(req, res) {
//     var client = req.user.client.id;
//     var render_data = {
//         title: '人才培养-清单',
//         user: req.user,
//     };
//     async.waterfall([

//         function(cb) {
//             DevelopeDirect.find({
//                 client: client
//             }).exec(cb)
//         },
//         function(develope, cb) {
//             var item = [];
//             _.each(develope, function(dev) {
//                 _.each(dev.candidate_data, function(can) {
//                     item.push(can.position)
//                 })
//             })
//             People.find({
//                 client: client,
//                 block: false,
//                 position: {
//                     $in: item
//                 }
//             }).exec(cb)
//         }
//     ], function(err, result) {
//         if (err) {
//             return res.status(500).json({
//                 code: 'ERR',
//                 msg: '内部服务器错误：' + err
//             });
//         }
//         if (result) {
//             render_data.people = result;
//             res.render('user/user_report/talent_develope/develope_list', render_data)
//         }
//     })
// }
//创建人才培养清单
var talent_develope_create_list = function(req, res) {
        var client = req.user.client.id;
        DevelopeListConfig.find({
            client: client
        }).exec(function(err, result) {
            if (result.length > 0) {
                async.times(result.length, function(n, next) {
                    var res = result[n];
                    var create_data = {
                        client: client,
                        people: res.people,
                        people_name: res.people_name,
                        position_name: res.position_name,
                        company_name: res.company_name,
                        people_no: res.people_no,
                        ou_name: res.ou_name,
                        position: res.position,
                        data_type: res.data_type
                    }
                    DevelopeList.findOne({
                        client: client,
                        people: res.people,
                        data_type: res.data_type
                    }).exec(function(err, data) {
                        if (data) {
                            data.save(next)
                        } else {
                            DevelopeList.create(create_data, next)
                        }
                    })
                }, function(err, data) {
                    res.json({
                        code: 'OK',
                        data: data
                    })
                })
            }
        })

    }
    //人才培养清单
    // var talent_develope_list = function(req, res) {
    //     var client = req.user.client.id;
    //     var render_data = {
    //         title: '人才培养-清单',
    //         user: req.user,
    //     };
    //     DevelopeList.find({
    //         client: client
    //     }).populate('people').exec(function(err, result) {
    //         if (err) {
    //             return res.status(500).json({
    //                 code: 'ERR',
    //                 msg: '内部服务器错误：' + err
    //             });
    //         }
    //         if (result) {
    //             render_data.people = result;
    //             res.render('user/user_report/talent_develope/develope_list', render_data)
    //         }
    //     })
    // }
var talent_develope_list = function(req, res) {
    var i18n = req.i18n;
    var client = req.user.client.id;
    var render_data = {
        title: '人才培养-清单',
        user: req.user,
    };
    DevelopeListConfig.find({
        client: client
    }).exec(function(err, result) {
        if (result.length > 0) {
            async.times(result.length, function(n, next) {
                var res = result[n];
                var create_data = {
                    client: client,
                    people: res.people,
                    people_name: res.people_name,
                    position_name: res.position_name,
                    company_name: res.company_name,
                    people_no: res.people_no,
                    ou_name: res.ou_name,
                    position: res.position,
                    data_type: res.data_type
                }
                DevelopeList.findOne({
                    client: client,
                    people: res.people,
                    data_type: res.data_type
                }).exec(function(err, data) {
                    if (data) {
                        data.save(next)
                    } else {
                        DevelopeList.create(create_data, next)
                    }
                })
            }, function(err, data) {
                res.render('user/user_report/talent_develope/develope_list', render_data);
            })
        }
    })
}
var develope_list_bb_list = function(req, res) {
    var i18n = req.i18n;
    var client = req.user.client.id;
    DevelopeList.find({
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
var develope_list_bb_fetch = function(req, res) {
    var i18n = req.i18n;
    var up_id = req.params.up_id;
    async.waterfall([

        function(cb) {
            DevelopeList.findById(up_id).exec(cb);
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
var develope_list_bb_create = function(req, res) {
    var i18n = req.i18n;
    var up_id = req.params.up_id;
    var client = req.user.client.id;
    var data4create = {
        client: client,
        // type_name: req.body.type_name,
    };
    async.waterfall([

        function(cb) {
            DevelopeList.create(data4create, cb);
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
                msg: sprintf('人才 <strong>%s</strong> 保存成功！', result.people_name),
                _id: result._id,
            });
        } else {
            return res.status(500).json({
                code: 'ERR',
                msg: '人才保存失败'
            });
        };
    })
}
var develope_list_bb_update = function(req, res) {
    var i18n = req.i18n;
    var up_id = req.params.up_id;
    async.waterfall([

        function(cb) {
            DevelopeList.findById(up_id, cb);
        },
        function(up, cb) {
            // up.type_name = req.body.type_name;
            console.log(req.body.is_sure);
            up.is_sure = req.body.is_sure;
            up.is_real_sure = req.body.is_real_sure;
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
                msg: sprintf('人才 <strong>%s</strong> 保存成功！', result.people_name),
                _id: result._id,
            });
        } else {
            return res.status(500).json({
                code: 'ERR',
                msg: '人才保存失败'
            });
        };
    })
}
var develope_list_bb_delete = function(req, res) {
        var i18n = req.i18n;
        var up_id = req.params.up_id;
        DevelopeList.findByIdAndRemove(up_id, function(err, up) {
            if (err) {
                return res.status(500).json({
                    code: 'ERR',
                    msg: '内部服务器错误：' + err
                });
            };
            if (up) {
                return res.json({
                    code: 'OK',
                    msg: sprintf('人才 <strong>%s</strong> 删除成功！', up.people_name),
                });
            } else {
                return res.status(500).json({
                    code: 'ERR',
                    msg: '人才删除失败'
                });
            };
        })
    }
    //人才培养计划
var develope_plan_bb_form = function(req, res) {
    var i18n = req.i18n;
    var client = req.user.client.id;
    var up_id = req.query.up_id;
    var render_data = {
        title: '人才培养计划',
        user: req.user,
        up_id: up_id,
    };
    async.parallel({
        plan: function(cb) {
            DevelopePlan.findById(up_id).populate('develope_direct').exec(cb)

        },
        type: function(cb) {
            DevelopeType.find({
                client: client
            }).exec(cb)
        },
        learn: function(cb) {
            LearnStyle.find({
                client: client
            }).exec(cb)

        },
        check: function(cb) {
            CheckStyle.find({
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
            render_data.data = result.plan;
            render_data.type = result.type;
            var style = {};
            _.each(result.type, function(temp) {
                _.each(temp.develope_style, function(data) {
                    style[data._id] = data.style_name
                })
            })
            render_data.style = style;
            render_data.learn = result.learn;
            render_data.check = result.check;
            res.render('user/user_report/talent_develope/plan_bbform', render_data);
        };
    })

}
var develope_plan_bb_list = function(req, res) {
    var i18n = req.i18n;
    var client = req.user.client.id;
    DevelopePlan.find({
        client: client
    }).populate('attachments.people attachments.file').exec(function(err, result) {
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
var develope_plan_bb_fetch = function(req, res) {
    var i18n = req.i18n;
    var up_id = req.params.up_id;
    async.waterfall([

        function(cb) {
            DevelopePlan.findById(up_id).populate('attachments.people attachments.file').exec(cb);
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
var develope_plan_bb_create = function(req, res) {
    var i18n = req.i18n;
    var up_id = req.params.up_id;
    var client = req.user.client.id;
    var data4create = {
        client: client,
        plan_name: req.body.plan_name,
        period_start: req.body.period_start,
        period_end: req.body.period_end,
        develope_direct: req.body.develope_direct,
        people: req.body.people,
        people_name: req.body.people_name,
        des_career: req.body.des_career,
        des_career_name: req.body.des_career_name,
        des_position: req.body.des_position,
        des_position_name: req.body.des_position_name,
    };
    async.waterfall([

        function(cb) {
            DevelopePlan.create(data4create, cb);
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
                msg: sprintf('人才培养计划 <strong>%s</strong> 保存成功！', result.plan_name),
                _id: result._id,
            });
        } else {
            return res.status(500).json({
                code: 'ERR',
                msg: '安排方式保存失败'
            });
        };
    })
}
var develope_plan_bb_update = function(req, res) {
    var i18n = req.i18n;
    var up_id = req.params.up_id;
    async.waterfall([

        function(cb) {
            DevelopePlan.findById(up_id, cb);
        },
        function(up, cb) {
            up.plan_name = req.body.plan_name;
            console.log(req.body.period_start);
            console.log(req.body.period_end);

            up.period_start = req.body.period_start;
            up.period_end = req.body.period_end;
            up.develope_direct = req.body.develope_direct;
            up.plan_divide = req.body.plan_divide;
            up.comment = req.body.comment;
            var attachments = req.body.attachments;
            _.each(attachments, function(temp) {
                temp.file = temp["file"]["_id"];
                temp.people = temp["people"]["_id"];
            })
            up.attachments = attachments;
            // up.type_description = req.body.type_description;
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
                msg: sprintf('安排方式 <strong>%s</strong> 保存成功！', result.plan_name),
                _id: result._id,
            });
        } else {
            return res.status(500).json({
                code: 'ERR',
                msg: '安排方式保存失败'
            });
        };
    })
}
var develope_plan_bb_delete = function(req, res) {
        var i18n = req.i18n;
        var up_id = req.params.up_id;
        DevelopePlan.findByIdAndRemove(up_id, function(err, up) {
            if (err) {
                return res.status(500).json({
                    code: 'ERR',
                    msg: '内部服务器错误：' + err
                });
            };
            if (up) {
                return res.json({
                    code: 'OK',
                    msg: sprintf('安排方式 <strong>%s</strong> 删除成功！', up.plan_name),
                });
            } else {
                return res.status(500).json({
                    code: 'ERR',
                    msg: '安排方式删除失败'
                });
            };
        })
    }
    //安排方式
var learn_inputhelp = function(req, res) {
        var client = req.user.client.id;
        LearnStyle.find({
            client: client
        }).exec(function(err, learns) {
            if (err) {
                req.app.locals.handle500(err, req, res);
            };
            if (learns) {
                res.render('user/user_report/talent_develope/learn_input_help', {
                    learns: learns
                });
            };
        })
    }
    //评估方式
var check_inputhelp = function(req, res) {
        var client = req.user.client.id;
        CheckStyle.find({
            client: client
        }).exec(function(err, checks) {
            if (err) {
                req.app.locals.handle500(err, req, res);
            };
            if (checks) {
                res.render('user/user_report/talent_develope/check_input_help', {
                    checks: checks
                });
            };
        })
    }
    //培养方式
var type_inputhelp = function(req, res) {
        var client = req.user.client.id;
        DevelopeType.find({
            client: client
        }).exec(function(err, types) {
            if (err) {
                req.app.locals.handle500(err, req, res);
            };
            if (types) {
                res.render('user/user_report/talent_develope/type_input_help', {
                    types: types
                });
            };
        })
    }
    //人才培养来源配置清单
var talent_develope_config_list = function(req, res) {
    var client = req.user.client.id;
    var render_data = {
        title: '人才培养来源-配置',
        user: req.user,
    };
    DevelopeListConfig.find({
        client: client
    }).populate('people').exec(function(err, result) {
        if (err) {
            return res.status(500).json({
                code: 'ERR',
                msg: '内部服务器错误：' + err
            });
        }
        if (result) {
            render_data.people = result;
            res.render('user/user_report/talent_develope/config_list', render_data)
        }
    })
}
var talent_develope_config = function(req, res) {
    var client = req.user.client.id;
    var people_id = String(req.params.people_id).split(',');
    var render_data = {
        title: '人才培养类别--配置',
        user: req.user,
    };
    if (people_id.length > 0) {
        async.waterfall([

            function(cb) {
                People.find({
                    client: client,
                    block: false
                }).exec(cb)
            },
            function(pep, cb) {
                var people_name_obj = {},
                    ou_name_obj = {},
                    company_name_obj = {},
                    position_name_obj = {},
                    people_no_obj = {},
                    position_id_obj = {};
                _.each(pep, function(temp) {
                    people_name_obj[temp._id] = temp.people_name;
                    ou_name_obj[temp._id] = temp.ou_name;
                    company_name_obj[temp._id] = temp.company_name;
                    position_name_obj[temp._id] = temp.position_name;
                    people_no_obj[temp._id] = temp.people_no;
                    position_id_obj[temp._id] = temp.position;
                })
                async.times(people_id.length, function(n, next) {
                    var people = people_id[n];
                    var create_data = {
                        client: client,
                        people: people,
                        people_name: people_name_obj[people],
                        people_no: people_no_obj[people],
                        company_name: company_name_obj[people],
                        ou_name: ou_name_obj[people],
                        position_name: position_name_obj[people],
                        position: position_id_obj[people],
                        data_type: 'P'
                    }
                    DevelopeListConfig.findOne({
                        client: client,
                        people: people,
                        data_type: 'P'
                    }).exec(function(err, result) {
                        if (result) {
                            result.save(next)
                        } else {
                            DevelopeListConfig.create(create_data, next)
                        }
                    })
                }, cb)
            }
        ], function(err, result) {
            res.json({
                code: 'OK',
                data: result
            })
        })

    }

}
var develope_plan_list_form = function(req, res) {
    var i18n = req.i18n;
    var client = req.user.client.id;
    var up_id = req.query.up_id;
    var render_data = {
        title: '人才培养计划',
        user: req.user,
        up_id: up_id,
    };

    res.render('user/user_report/talent_develope/plan_list', render_data);

}
var get_type_data = function(req, res) {
        var i18n = req.i18n;
        var client = req.user.client.id;
        var type_id = req.params.type_id;
        DevelopeType.findById(type_id).exec(function(err, types) {
            if (err) {
                return res.json({
                    code: 'ERR',
                    msg: '内部服务器错误：' + err
                });
            };
            return res.json({
                code: 'OK',
                msg: '数据获取成功，数据在data字段中。',
                data: types,
            });
        })
    }
    // var get_style_check_data = function(req, res) {
    //     var i18n = req.i18n;
    //     var client = req.user.client.id;
    //     var type_id = req.params.type_id;
    //     var style_id = req.params.style_id;
    //     DevelopeType.findById(type_id).exec(function(err, types) {
    //         if (err) {
    //             return res.json({
    //                 code: 'ERR',
    //                 msg: '内部服务器错误：' + err
    //             });
    //         };
    //         return res.json({
    //             code: 'OK',
    //             msg: '数据获取成功，数据在data字段中。',
    //             data: types,
    //         });
    //     })
    // }
module.exports = function(app, checkAuth) {
    var __base_path = '/admin/pm/talent_develope';
    //培养类别
    app.get(__base_path + '/type_form', checkAuth, develope_type_bbform);
    app.get(__base_path + '/type', checkAuth, develope_type_bb_form);
    app.get(__base_path + '/type_bb', checkAuth, develope_type_bb_list); //列表
    app.get(__base_path + '/type_bb/:up_id', checkAuth, develope_type_bb_fetch); //获取
    app.post(__base_path + '/type_bb/:up_id', checkAuth, develope_type_bb_create); //新建的保存
    app.put(__base_path + '/type_bb/:up_id', checkAuth, develope_type_bb_update); //更新的保存
    app.delete(__base_path + '/type_bb/:up_id', checkAuth, develope_type_bb_delete); //删除

    // //培养方式
    // app.get(__base_path + '/bbform', checkAuth, talent_type_bb_form);
    // app.get(__base_path + '/bb', checkAuth, talent_type_bb_list); //列表
    // app.get(__base_path + '/bb/:up_id', checkAuth, talent_type_bb_fetch); //获取
    // app.post(__base_path + '/bb/:up_id', checkAuth, talent_type_bb_create); //新建的保存
    // app.put(__base_path + '/bb/:up_id', checkAuth, talent_type_bb_update); //更新的保存
    // app.delete(__base_path + '/bb/:up_id', checkAuth, talent_type_bb_delete); //删除
    //安排方式
    app.get(__base_path + '/learn_bbform', checkAuth, learn_style_bb_form); //列表
    app.get(__base_path + '/learn_bb', checkAuth, learn_style_bb_list); //列表
    app.get(__base_path + '/learn_bb/:up_id', checkAuth, learn_style_bb_fetch); //获取
    app.post(__base_path + '/learn_bb/:up_id', checkAuth, learn_style_bb_create); //新建的保存
    app.put(__base_path + '/learn_bb/:up_id', checkAuth, learn_style_bb_update); //更新的保存
    app.delete(__base_path + '/learn_bb/:up_id', checkAuth, learn_style_bb_delete); //删除
    //评估方式
    app.get(__base_path + '/check_bbform', checkAuth, check_style_bb_form); //列表
    app.get(__base_path + '/check_bb', checkAuth, check_style_bb_list); //列表
    app.get(__base_path + '/check_bb/:up_id', checkAuth, check_style_bb_fetch); //获取
    app.post(__base_path + '/check_bb/:up_id', checkAuth, check_style_bb_create); //新建的保存
    app.put(__base_path + '/check_bb/:up_id', checkAuth, check_style_bb_update); //更新的保存
    app.delete(__base_path + '/check_bb/:up_id', checkAuth, check_style_bb_delete); //删除
    app.get(__base_path + '/panel', checkAuth, develope_panel);
    //人才培养清单
    // app.get(__base_path + '/list', checkAuth, talent_develope_list); //列表
    app.get(__base_path + '/list', checkAuth, talent_develope_list); //列表
    app.get(__base_path + '/list_bb', checkAuth, develope_list_bb_list); //列表
    app.get(__base_path + '/list_bb/:up_id', checkAuth, develope_list_bb_fetch); //获取
    app.post(__base_path + '/list_bb/:up_id', checkAuth, develope_list_bb_create); //新建的保存
    app.put(__base_path + '/list_bb/:up_id', checkAuth, develope_list_bb_update); //更新的保存
    app.delete(__base_path + '/list_bb/:up_id', checkAuth, develope_list_bb_delete); //删除
    //创建人才培养清单
    app.post(__base_path + '/create_list', checkAuth, talent_develope_create_list); //列表

    //人才培养计划
    app.get(__base_path + '/plan_bbform', checkAuth, develope_plan_bb_form); //列表
    app.get(__base_path + '/plan', checkAuth, develope_plan_bb_list); //列表
    app.get(__base_path + '/plan/:up_id', checkAuth, develope_plan_bb_fetch); //获取
    app.post(__base_path + '/plan/:up_id', checkAuth, develope_plan_bb_create); //新建的保存
    app.put(__base_path + '/plan/:up_id', checkAuth, develope_plan_bb_update); //更新的保存
    app.delete(__base_path + '/plan/:up_id', checkAuth, develope_plan_bb_delete); //删除
    //input_help
    app.get(__base_path + '/learn_inputhelp', checkAuth, learn_inputhelp); //列表
    app.get(__base_path + '/check_inputhelp', checkAuth, check_inputhelp); //列表
    app.get(__base_path + '/type_inputhelp', checkAuth, type_inputhelp); //列表

    //人才培养清单来源配置
    app.get(__base_path + '/config_list', checkAuth, talent_develope_config_list); //列表
    app.post(__base_path + '/config/:people_id', checkAuth, talent_develope_config); //列表
    //人才培养计划清单
    app.get(__base_path + '/plan_list', checkAuth, develope_plan_list_form); //列表
    //选择过滤数据
    app.get(__base_path + '/sel_type_data/:type_id', checkAuth, get_type_data); //列表
    // app.get(__base_path + '/sel_style_data/:type_id/:style_id', checkAuth, sel_style_data); //列表

}
