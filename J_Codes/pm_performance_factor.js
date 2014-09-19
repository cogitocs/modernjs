var sprintf = require('sprintf').sprintf;
var util = require('util');
var _ = require('underscore');
var async = require('async');
var moment = require('moment');
var FactorCombination = require('../../models/pm').FactorCombination;
var PerformancePayrollFactor = require('../../models/pm').PerformancePayrollFactor;
var User = require('../../models/user');
var Company = require('../../models/structure').Company;
var Position = require('../../models/position').Position;
var People = require('../../models/people').People;
var PointsSystemClient = require('../../models/pm').PointsSystemClient;
var IndexType = require('../../models/pm').IndexType;
var OrganizationUnit = require('../../models/organization').OrganizationUnit;
var PeopleFactor = require('../../models/pm').PeopleFactor;
var JobLevel = require('../../models/position').JobLevel;
var JobRank = require('../../models/position').JobRank;
var AssessmentInstance = require('../../models/pm').AssessmentInstance;
var ObjectivePlan = require('../../models/pm').ObjectivePlan;

var type_enum = [{
        type: 'optgroup',
        label: '个人系数',
        subs: [{
            type: 'option',
            key: 'A',
            val: '绩效工资系数个人'
        }, ]

    }, {
        type: 'optgroup',
        label: '系数组合',
        subs: [{
            type: 'option',
            key: 'B',
            val: '绩效工资个人系数和绩效工资部门系数的乘积'
        }, {
            type: 'option',
            key: 'C',
            val: '绩效工资个人系数和绩效工资部门系数加权求和'
        }, ]

    }

];


//列表
var performance_payroll_facotr_list = function(req, res) {
    var i18n = req.i18n;
    var client = req.user.client.id;
    var people = req.query.people || req.user.people._id;
    var position = req.query.position || req.user.people.position;
    var render_data = {
        title: '绩效工资系数配置－清单',
        user: req.user,
        _: _,
    };
    res.render('admin/pm/performance_payroll_factor/list', render_data);
}

var performance_payroll_facotr_bb_form = function(req, res) {
    var i18n = req.i18n;
    var client = req.user.client.id;
    var up_id = req.query.up_id;
    var render_data = {
        title: '绩效工资系数配置',
        user: req.user,
        mode: 'edit',
        up_id: up_id,
    };
    PerformancePayrollFactor.findById(up_id).exec(function(err, factors) {
        if (err) {
            return res.json({
                code: 'ERR',
                msg: '内部服务器错误：' + err
            });
        } else {
            render_data.factor_name = factors.factor_name;
            render_data.factor_category = factors.factor_category;
            render_data.org_category = factors.org_category ? factors.org_category : false;
            res.render('admin/pm/performance_payroll_factor/factor_bbform', render_data);
        };
    })
}
var performance_payroll_facotr_bb_list = function(req, res) {
    var i18n = req.i18n;
    var client = req.user.client.id;
    PerformancePayrollFactor.find({
        client: client
    }).exec(function(err, factors) {
        if (err) {
            return res.json({
                code: 'ERR',
                msg: '内部服务器错误：' + err
            });
        } else {
            return res.json(factors);
        };
    })
}
var performance_payroll_facotr_grade_bb = function(req, res) {
    var i18n = req.i18n;
    var client = req.user.client.id;
    var client = req.user.client.id;
    PerformancePayrollFactor.find({
        client: client
    }).exec(function(err, factors) {
        if (err) {
            return res.json({
                code: 'ERR',
                msg: '内部服务器错误：' + err
            });
        } else {
            return res.json(factors);
        };
    })
}
var performance_factor_bb_create = function(req, res) {
    var i18n = req.i18n;
    var client = req.user.client.id;
    var up_id = req.params.up_id;
    async.waterfall([

        function(cb) {
            async.parallel({
                grade_data: function(cb) {
                    PointsSystemClient.findOne({
                        client: client,
                        is_base: true
                    }).exec(function(err, result) {
                        if (result) {
                            var grades = result.grades ? result.grades : '';
                            cb(null, grades);
                        }
                    })
                },
                index_data: function(cb) {
                    IndexType.find({
                        client: client
                    }).exec(cb)
                }
            }, cb)
        }
    ], function(err, result) {
        var grades = result.grade_data;
        var index = result.index_data;
        var g_arr = [],
            index_arr = [];
        _.each(grades, function(temp) {
            var obj = {};
            obj.grade_name = temp.grade_name;
            g_arr.push(obj)
        })
        _.each(index, function(temp) {
            var obj = {};
            obj.index_type = temp._id;
            obj.index_name = temp.index_type_name;
            index_arr.push(obj)
        })
        var factor_items = {};
        factor_items.grades = g_arr;
        factor_items.indicator = index_arr;
        var data4create = {
            client: client,
            factor_name: req.body.factor_name,
            factor_category: req.body.factor_category,
            factor_items: factor_items
        };
        PerformancePayrollFactor.create(data4create, function(err, result) {
            if (err) {
                return res.status(500).json({
                    code: 'ERR',
                    msg: '内部服务器错误：' + err
                });
            };
            if (result) {
                return res.json({
                    code: 'OK',
                    msg: sprintf('绩效工资系数配置 <strong>%s</strong> 保存成功！', result.sc_name),
                    _id: result._id,
                });
            } else {
                return res.status(500).json({
                    code: 'ERR',
                    msg: '绩效工资系数配置保存失败'
                });
            };
        })
    })

}
var performance_factor_bb_update = function(req, res) {
    var i18n = req.i18n;
    var up_id = req.params.up_id;
    async.waterfall([

        function(cb) {
            PerformancePayrollFactor.findById(up_id, cb);
        },
        function(up, cb) {
            up.factor_items = req.body.factor_items;
            up.factor_name = req.body.factor_name;
            up.factor_category = req.body.factor_category;
            if (req.body.org_category) {
                up.org_category = req.body.org_category;
            }
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
                msg: sprintf('绩效工资系数配置 <strong>%s</strong> 保存成功！', result.factor_name),
                _id: result._id,
            });
        } else {
            return res.status(500).json({
                code: 'ERR',
                msg: '绩效工资系数配置保存失败'
            });
        };
    })
}
var performance_factor_bb_delete = function(req, res) {
    var i18n = req.i18n;
    var up_id = req.params.up_id;
    PerformancePayrollFactor.findByIdAndRemove(up_id, function(err, up) {
        if (err) {
            return res.status(500).json({
                code: 'ERR',
                msg: '内部服务器错误：' + err
            });
        };
        if (up) {
            return res.json({
                code: 'OK',
                msg: sprintf('绩效工资系数配置 <strong>%s</strong> 删除成功！', up.factor_name),
            });
        } else {
            return res.status(500).json({
                code: 'ERR',
                msg: '绩效工资系数配置删除失败'
            });
        };
    })
}
var performance_factor_bb_fetch = function(req, res) {
    var i18n = req.i18n;
    var up_id = req.params.up_id;
    PerformancePayrollFactor.findById(up_id).exec(function(err, result) {
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
//系数组合配置
var performance_payroll_facotr_com_list = function(req, res) {
    var i18n = req.i18n;
    var client = req.user.client.id;
    var people = req.query.people || req.user.people._id;
    var render_data = {
        title: '绩效工资系数组合配置－清单',
        user: req.user,
        _: _,
    };
    res.render('admin/pm/performance_payroll_factor/com_list', render_data);
}

var performance_payroll_facotr_com_bb_form = function(req, res) {
    var i18n = req.i18n;
    var client = req.user.client.id;
    var up_id = req.query.up_id;
    var render_data = {
        title: '绩效工资系数组合配置',
        user: req.user,
        mode: 'edit',
        up_id: up_id,
    };
    async.parallel({
        factor_data: function(cb) {
            PerformancePayrollFactor.find({
                client: client
            }).exec(cb)
        },
        fc_data: function(cb) {
            FactorCombination.findById(up_id).exec(cb)
        }
    }, function(err, result) {
        if (err) {
            return res.json({
                code: 'ERR',
                msg: '内部服务器错误：' + err
            });
        } else {
            var factor_data = result.factor_data ? result.factor_data : '';
            var fc_data = result.fc_data ? result.fc_data : '';
            var obj_p = {}, obj_o = {};
            _.each(factor_data, function(temp) {
                if (temp.factor_category == 'P') {
                    obj_p[temp._id] = temp.factor_name;
                } else {
                    obj_o[temp._id] = temp.factor_name;
                }
            })
            render_data.type_enum = type_enum;
            render_data.obj_p = obj_p;
            render_data.obj_o = obj_o;
            // render_data.is_weight = fc_data.combination_data.is_weight;
            render_data.combination_name = fc_data.combination_name;
            render_data.pep_weight = fc_data.combination_data.people_data.weight ? fc_data.combination_data.people_data.weight : '';
            render_data.org_weight = fc_data.combination_data.org_data.weight ? fc_data.combination_data.org_data.weight : '';
            render_data.pep_radio = fc_data.combination_data.people_data.factor_detail ? fc_data.combination_data.people_data.factor_detail : '';
            render_data.org_radio = fc_data.combination_data.org_data.factor_detail ? fc_data.combination_data.org_data.factor_detail : '';
            render_data.factor_p = fc_data.combination_data.people_data.factor ? fc_data.combination_data.people_data.factor : '';
            render_data.factor_o = fc_data.combination_data.org_data.factor ? fc_data.combination_data.org_data.factor : '';
            render_data.factor_type = fc_data.combination_data.factor_type;
            res.render('admin/pm/performance_payroll_factor/com_bbform', render_data);
        };
    })
}
var performance_payroll_facotr_com_bb_list = function(req, res) {
    var i18n = req.i18n;
    var client = req.user.client.id;
    async.waterfall([

        function(cb) {
            PerformancePayrollFactor.find({
                client: client
            }).exec(cb)
        }

    ], function(err, result) {
        var obj = {};
        _.each(result, function(temp) {
            obj[temp._id] = temp.factor_name;
        })
        FactorCombination.find({
            client: client
        }).exec(function(err, factors) {
            if (err) {
                return res.json({
                    code: 'ERR',
                    msg: '内部服务器错误：' + err
                });
            } else {
                // factors.push(obj);
                return res.json({
                    factors: factors,
                    obj: obj
                });
            };
        })
    })

}
var performance_factor_com_bb_create = function(req, res) {
    var i18n = req.i18n;
    var client = req.user.client.id;
    var up_id = req.params.up_id;
    var data4create = {
        client: client,
        combination_name: req.body.combination_name
    }
    FactorCombination.create(data4create, function(err, result) {
        if (err) {
            return res.status(500).json({
                code: 'ERR',
                msg: '内部服务器错误：' + err
            });
        };
        if (result) {
            return res.json({
                code: 'OK',
                msg: sprintf('绩效工资系数组合配置 <strong>%s</strong> 保存成功！', result.combination_name),
                _id: result._id,
            });
        } else {
            return res.status(500).json({
                code: 'ERR',
                msg: '绩效工资系数组合配置保存失败'
            });
        };
    })

}
var performance_factor_com_bb_update = function(req, res) {
    var i18n = req.i18n;
    var up_id = req.params.up_id;
    async.waterfall([

        function(cb) {
            FactorCombination.findById(up_id, cb);
        },
        function(up, cb) {
            up.combination_name = req.body.combination_name;
            up.combination_data = req.body.combination_data;
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
                msg: sprintf('绩效工资系数组合配置 <strong>%s</strong> 保存成功！', result.combination_name),
                _id: result._id,
            });
        } else {
            return res.status(500).json({
                code: 'ERR',
                msg: '绩效工资系数组合配置保存失败'
            });
        };
    })
}
var performance_factor_com_bb_delete = function(req, res) {
    var i18n = req.i18n;
    var up_id = req.params.up_id;
    FactorCombination.findByIdAndRemove(up_id, function(err, up) {
        if (err) {
            return res.status(500).json({
                code: 'ERR',
                msg: '内部服务器错误：' + err
            });
        };
        if (up) {
            return res.json({
                code: 'OK',
                msg: sprintf('绩效工资系数组合配置 <strong>%s</strong> 删除成功！', up.combination_name),
            });
        } else {
            return res.status(500).json({
                code: 'ERR',
                msg: '绩效工资系数组合配置删除失败'
            });
        };
    })
}
var performance_factor_com_bb_del = function(req, res) {
    var i18n = req.i18n;
    var up_id = req.body.up_id;
    FactorCombination.findByIdAndRemove(up_id, function(err, up) {
        if (err) {
            return res.status(500).json({
                code: 'ERR',
                msg: '内部服务器错误：' + err
            });
        };
        if (up) {
            return res.json({
                code: 'OK',
                msg: sprintf('绩效工资系数组合配置 <strong>%s</strong> 删除成功！', up.combination_name),
            });
        } else {
            return res.status(500).json({
                code: 'ERR',
                msg: '绩效工资系数组合配置删除失败'
            });
        };
    })
}
var performance_factor_com_bb_fetch = function(req, res) {
    var i18n = req.i18n;
    var up_id = req.params.up_id;
    FactorCombination.findById(up_id).exec(function(err, result) {
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

//人员绩效工资系数赋予
var performance_factor_pep = function(req, res) {
    var client = req.user.client.id;
    var render_data = {
        title: '批量配置绩效工资系数',
        user: req.user,
    };
    FactorCombination.find({
        client: client
    }).exec(function(err, result) {
        var items = {}, factor_type = {};
        _.each(result, function(temp) {
            items[temp._id] = temp.combination_name;
            factor_type[temp._id] = temp.combination_data ? temp.combination_data.factor_type : '';
        })
        render_data.items = items;
        render_data.factor_type = factor_type;
        res.render('admin/pm/performance_payroll_factor/pep_list', render_data)
    })
}
// var people_help_json = function(req, res) {
//     var client = req.user.client;
//     var cond = {
//         client: client
//     };
//     cond.com_factor = null;
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
//                 socias: function(cb) {
//                     PeopleFactor.find(cond).populate('people').exec(function(err, factors) {
//                         if (factors) {
//                             var pps = [];
//                             us.each(factors, function(s) {
//                                 pps.push(s.people)
//                             })
//                             cb(null, pps)
//                         };
//                     })
//                 },
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
//                     var o_p = us.filter(dc.socias, function(p) {
//                         return us.isEqual(p.ou, o._id)
//                     })
//                     us.each(o_p, function(p) {
//                         var row = {
//                             'p_id': p.id,
//                             'id': p.user,
//                             'pId': o._id,
//                             'firstname': p.firstname,
//                             'lastname': p.lastname,
//                             'name': p.firstname + p.lastname,
//                             'code': p.people_no,
//                             'company': p.company,
//                             'company_name': p.company_name,
//                             'ou': p.ou,
//                             'ou_name': p.ou_name,
//                             'position': p.position,
//                             'position_name': p.position_name,
//                             'type': 'p'
//                         };
//                         ret_data.push(row);
//                     })
//                 })

//             })

//             cb(null, ret_data);
//         }
//     ], function(err, result) {
//         res.send(result);
//     })
// }
var people_help_json = function(req, res) {
    var user = req.user;
    var client = req.user.client;
    var p_type = req.params.p_type;
    var cond2 = {
        client: client
    };
    if (p_type == 'c') {
        cond2.com_factor = null;
    } else {
        cond2.com_factor = {
            $ne: null
        }
    }
    async.waterfall([

        function(cb) {
            async.parallel({
                joblevels: function(cb) {
                    JobLevel.find({
                        client: client.id,
                        block: false,
                        // activate: true
                    }).sort({
                        joblevel_code: -1
                    }).exec(cb);
                },
                jobranks: function(cb) {
                    JobRank.find({
                        client: client.id,
                        block: false,
                        // activate: true
                    }).sort({
                        jobrank_code: -1
                    }).exec(cb);
                },
                positions: function(cb) {
                    var cond = {
                        client: client.id,
                        block: false,
                        // activate: true,
                        company: {
                            '$in': user.companies
                        }, //选取有权限的公司代码数据
                    };
                    Position.find(cond).populate('belongto_ou company').sort({
                        position_code: 1
                    }).exec(cb);
                },
                socias: function(cb) {
                    PeopleFactor.find(cond2).populate('position').exec(function(err, factors) {
                        if (factors) {
                            var pps = [];
                            us.each(factors, function(s) {
                                pps.push(String(s.position._id))
                            })
                            cb(null, pps)
                        };
                    })
                }
            }, cb);
        },
        function(dc, cb) {
            var ret_data = [];
            var dc_positions = _.filter(dc.positions, function(temp) {
                return !!~dc.socias.indexOf(String(temp._id))
            })
            _.each(dc.joblevels, function(jl) {
                var pos_count = 0; //层级下的职位总数
                var jl_jr = _.filter(dc.jobranks, function(jr) {
                    return _.isEqual(jr.joblevel, jl._id)
                })
                _.each(jl_jr, function(jr) {
                    var jr_pos = _.filter(dc_positions, function(pos) {
                        return _.isEqual(pos.jobrank, jr._id)
                    });
                    pos_count += jr_pos.length; //计算职位总数
                    var row = {
                        'id': jr._id,
                        'pId': jl._id,
                        'name': sprintf('(%s)%s(%d个职位)', jr.jobrank_code, jr.jobrank_name, jr_pos.length),
                        'type': 'R'
                    };
                    ret_data.push(row);
                    _.each(jr_pos, function(pos) {
                        var row = {
                            'id': pos._id,
                            'pId': jr._id,
                            'name': pos.position_name + '/' + ((pos.belongto_ou) ? pos.belongto_ou.ou_name : '<未分配部门>') + '/' + ((pos.company) ? pos.company.company_name : '<未分配公司>'),
                            'type': 'P',
                            'position_code': pos.position_code,
                            'position_name': pos.position_name,
                            'company_name': pos.company ? pos.company.company_name : '<未分配公司>',
                            'ou_name': pos.belongto_ou ? pos.belongto_ou.ou_name : '<未分配部门>',
                            'joblevel_name': jl.joblevel_name,
                        };
                        ret_data.push(row);
                    })
                })
                var row = {
                    'id': jl._id,
                    'pId': null,
                    'name': sprintf('(%s)%s(%d个职位)', jl.joblevel_code, jl.joblevel_name, pos_count),
                    'type': 'L'
                };
                ret_data.push(row);
            })
            cb(null, ret_data);
        }
    ], function(err, result) {
        res.send(result)
    })
}
var position_help_json = function(req, res) {
    var client = req.user.client;
    var c_type = req.params.c_type;
    var cond = {
        client: client
    };
    if (c_type == 'c') {
        cond.com_factor = null;
    } else {
        cond.com_factor = {
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
                socias: function(cb) {
                    PeopleFactor.find(cond).populate('position').exec(function(err, factors) {
                        if (factors) {
                            var pps = [];
                            us.each(factors, function(s) {
                                pps.push(String(s.position._id))
                            })
                            cb(null, pps)
                        };
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
                        return !!~dc.socias.indexOf(String(p._id))
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
var people_performance_list = function(req, res) {
    var i18n = req.i18n;
    var client = req.user.client.id;
    var render_data = {
        title: '人员绩效工资系数配置－列表',
        user: req.user,
    };
    console.log(req.user.companies);
    async.waterfall([

        function(cb) {
            async.parallel({
                pep: function(cb) {
                    People.find({
                        client: client,
                        block: false
                    }).exec(cb)
                }
            }, cb)

        },
        function(result, cb) {
            var pep_data = result.pep;
            async.times(pep_data.length, function(n, next) {
                var pep = pep_data[n];
                var pep_pos = [];

                if (pep.position) {
                    pep_pos.push(pep.position);
                }
                if (pep.has_parttime_positions) {
                    _.each(pep.parttime_positions, function(temp) {
                        pep_pos.push(temp)
                    })
                }
                if (pep_pos.length > 0) {
                    async.times(pep_pos.length, function(n, next) {
                        var obj = {};
                        obj.client = client;
                        obj.position = pep_pos[n] ? pep_pos[n] : null;
                        obj.com_factor = null;
                        obj.people = pep._id;
                        PeopleFactor.findOne({
                            client: client,
                            people: pep._id,
                            position: pep_pos[n]
                        }).exec(function(err, sia) {
                            if (err) {
                                req.app.locals.handle500(err, req, res);
                            }
                            if (sia) {
                                sia.save(next)
                            } else {
                                PeopleFactor.create(obj, next)
                            }
                        })
                    }, next)
                } else {
                    next(null, null)
                }
            }, cb)
        }
    ], function(err, total_result) {
        res.render('admin/pm/performance_payroll_factor/factor_list', render_data);
    })
}
var people_get_factor = function(req, res) {
    var client = req.user.client.id;
    var factor_id = req.body.factor_id;
    var pps = JSON.parse(req.body.pps);
    var type = req.body.type;
    var msg = '配置成功！！';
    var msg_c = '配置失败！！';
    if (type == 'u') {
        msg = '修改成功！！';
        msg_c = '修改失败！！';
    };
    var p = {};
    p.com_factor = factor_id;
    async.times(pps.length, function(n, next) {
        PeopleFactor.find({
            client: client,
            position: pps[n]
        }, function(err, result) {
            if (result) {
                async.times(result.length, function(n, next) {
                    var res = result[n];
                    res.com_factor = factor_id;
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
var people_factor_single_edit = function(req, res) {
    var render_data = {
        title: '人员绩效工资系数配置－编辑',
        modi_type: 'edit',
        user: req.user,
    };
    var client = req.user.client.id;
    var factor_id = req.query.factor_id;
    PeopleFactor.findById(factor_id).populate('people position com_factor').exec(function(err, result) {
        render_data.factor = result;
        res.render('admin/pm/performance_payroll_factor/edit', render_data);
    })
}
var people_factor_input_help = function(req, res) {
    var client = req.user.client.id;
    FactorCombination.find({
        client: client
    }).exec(function(err, result) {
        var items = {}, factor_type = {};
        _.each(result, function(temp) {
            items[temp._id] = temp.combination_name;
            factor_type[temp._id] = temp.combination_data ? temp.combination_data.factor_type : '';
        })
        res.render('admin/pm/performance_payroll_factor/input_help', {
            items: items,
            factor_type: factor_type
        })
    })
}
var people_factor_del = function(req, res) {
    var client = req.user.client.id;
    var del_id = req.body.sia_id;
    PeopleFactor.findByIdAndRemove(del_id).exec(function(err, result) {
        if (err) {
            return res.json({
                code: 'ERR',
                msg: '内部服务器错误：' + err
            })
        }
        if (result) {
            return res.json({
                code: 'OK',
                msg: '数据删除成功！！！'
            })
        }
    })
}
var performance_payroll_facotr_pep_bb_list = function(req, res) {
    var i18n = req.i18n;
    var client = req.user.client.id;
    PeopleFactor.find({
        client: client
    }).populate('people com_factor').exec(function(err, factors) {
        if (err) {
            return res.json({
                code: 'ERR',
                msg: '内部服务器错误：' + err
            });
        } else {
            return res.json(factors);
        };
    })
}
var performance_factor_pep_bb_update = function(req, res) {
    var i18n = req.i18n;
    var up_id = req.params.factor_id;
    async.waterfall([

        function(cb) {
            PeopleFactor.findById(up_id, cb);
        },
        function(up, cb) {
            up.com_factor = req.body.com_factor;
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
                msg: sprintf('绩效工资系数配置保存成功！'),
                _id: result._id,
            });
        } else {
            return res.status(500).json({
                code: 'ERR',
                msg: '绩效工资系数配置保存失败'
            });
        };
    })
}
var performance_factor_pep_bb_fetch = function(req, res) {
    var i18n = req.i18n;
    var up_id = req.params.factor_id;
    PeopleFactor.findById(up_id).exec(function(err, result) {
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
//factor_test_run
var run_pep_factor = function(req, res) {
    var client = req.user.client.id;
    var sEcho = req.body.sEcho ? req.body.sEcho : 1;
    //从第几行开始查
    var iDisplayStart = req.body.iDisplayStart ? req.body.iDisplayStart : 0;
    //每页显示的长度
    var iDisplayLength = req.body.iDisplayLength ? req.body.iDisplayLength : 10;
    var sSearch = req.body.sSearch || ''; //搜索框输入的值
    //查询条件
    var status_arr = ['9', '10', '11', '12', '13'];
    var cond = {
        client: client
    };
    cond.year = req.body.year || moment().format('YYYY'); //查询当年的
    var search_company = String(req.body.company).split(',');
    cond.company = {
        $in: search_company
    };
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
        }, {
            ai_grade: re
        }, {
            ai_forced_distribution_grade: re
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
    var sort_cond = {};
    for (var i = 0; i < col_sort_num; i++) {
        if (req.body['iSortCol_' + i]) { //循环来判断是不是有
            var dir = req.body['sSortDir_' + i];

            sort_cond[col_name[req.body['iSortCol_' + i]]] = (dir == 'asc') ? 1 : -1;
        }
    };
    var clone_cond = _.clone(cond);
    ///////////****************//////////////////////////////////////
    async.waterfall([

        function(cb) {
            async.parallel({
                assess_data: function(cb) {
                    cond.ai_status = {
                        $in: status_arr
                    }
                    AssessmentInstance.find(cond).populate('people position ou company').exec(cb)
                },
                factor_data: function(cb) {
                    PeopleFactor.find({
                        client: client,
                    }).populate('com_factor').exec(cb)
                },
                perfor_data: function(cb) {
                    PerformancePayrollFactor.find({
                        client: client
                    }).exec(cb)
                },
                ps_data: function(cb) {
                    PointsSystemClient.findOne({
                        client: client,
                        activate: true,
                        block: false,
                        is_base: true
                    }).exec(cb)
                },
                obj_data: function(cb) {
                    clone_cond.op_status = '6';
                    ObjectivePlan.find(clone_cond).exec(cb)
                }
            }, cb)
        },
        function(result, cb) {
            async.parallel({
                obj_data: function(cb) {
                    var assess_data = result.assess_data ? result.assess_data : '';
                    var factor_data = result.factor_data ? result.factor_data : '';
                    var perfor_data = result.perfor_data ? result.perfor_data : '';
                    var grade_data = result.ps_data ? result.ps_data.grades : '';
                    var obj_data = result.obj_data ? result.obj_data : '';
                    if (assess_data) {
                        if (assess_data.length > 0) {
                            var obj = {};
                            async.times(assess_data.length, function(x, n) {
                                var assess_single = assess_data[x];
                                var factor_single = _.find(factor_data, function(temp) {
                                    return temp.people == String(assess_single.people._id) && temp.position == String(assess_single.position._id)
                                })
                                //部门管理者数据
                                var same_ou_data = _.filter(assess_data, function(data) {
                                    return data.ou._id == String(assess_single.ou._id)
                                })
                                var manager_single = _.find(same_ou_data, function(data) {
                                    return data.position.position_manager
                                })
                                var manager_single_temp = manager_single ? manager_single : '';

                                //部门平均得分数据
                                var score_all = 0;
                                _.each(same_ou_data, function(data) {
                                    score_all += data.ai_score;
                                })
                                //部门平均绩效得分
                                var divide_score = Math.round((score_all / same_ou_data.length) * 100) / 100;
                                var g_data = _.find(grade_data, function(data) {
                                    return divide_score >= data.score_low_value && divide_score < data.score_high_value;
                                })
                                //部门平均绩效得分等级
                                var divide_score_grade = g_data ? g_data.grade_name : '';
                                //人员目标得分
                                var obj_score = _.find(obj_data, function(data) {
                                    return data.people == String(assess_single.people._id)
                                })
                                var obj_score_temp = obj_score ? obj_score.op_score : 0;
                                //部门目标得分
                                var same_obj_ou_data = _.filter(obj_data, function(data) {
                                    return data.ou == String(assess_single.ou._id)
                                })
                                var obj_ou_score = 0;
                                _.each(same_obj_ou_data, function(data) {
                                    obj_ou_score += data.op_score
                                })
                                var divide_obj_score = Math.round((obj_ou_score / same_obj_ou_data.length) * 100) / 100;
                                if (factor_single) {
                                    var swap_data = factor_single.com_factor ? factor_single.com_factor.combination_data : '';
                                    var factor_type = swap_data.factor_type;
                                    switch (factor_type) {
                                        //个人系数
                                        case 'A':
                                            var perfor_id = swap_data.people_data.factor;
                                            var perfor_detail = swap_data.people_data.factor_detail;
                                            switch (perfor_detail) {
                                                //按绩效等级
                                                case 'A':
                                                    var perfor_single = _.find(perfor_data, function(temp) {
                                                        return temp._id == String(perfor_id)
                                                    })
                                                    if (perfor_single) {
                                                        var grades_data = perfor_single.factor_items.grades;
                                                        var perfor_sigle_to = _.find(grades_data, function(temp) {
                                                            return temp.grade_name == assess_single.ai_grade;
                                                        })
                                                        obj[assess_single._id] = perfor_sigle_to ? perfor_sigle_to.factor : 1;
                                                    }
                                                    break;
                                                    //按绩效得分区间
                                                case 'B':
                                                    var perfor_single = _.find(perfor_data, function(temp) {
                                                        return temp._id == String(perfor_id)
                                                    })
                                                    if (perfor_single) {
                                                        var section_data = perfor_single.factor_items.score_section;
                                                        var perfor_sigle_to = _.find(section_data, function(temp) {
                                                            return temp.score_low_value <= assess_single.ai_score && temp.score_high_value > assess_single.ai_score;
                                                        })
                                                        obj[assess_single._id] = perfor_sigle_to ? perfor_sigle_to.factor : 1;
                                                    }
                                                    break;
                                            }
                                            break;
                                            //组合系数 乘积
                                        case 'B':
                                            var perfor_pep_id = swap_data.people_data.factor;
                                            var perfor_org_id = swap_data.org_data.factor;
                                            var perfor_pep_detail = swap_data.people_data.factor_detail;
                                            var perfor_org_detail = swap_data.org_data.factor_detail;
                                            var factor_xl = 0,
                                                factor_xr = 0;
                                            switch (perfor_pep_detail) {
                                                //按绩效等级
                                                case 'A':
                                                    var perfor_pep_single = _.find(perfor_data, function(temp) {
                                                        return temp._id == String(perfor_pep_id)
                                                    })
                                                    if (perfor_pep_single) {
                                                        var grades_data = perfor_pep_single.factor_items.grades;
                                                        var perfor_sigle_to = _.find(grades_data, function(temp) {
                                                            return temp.grade_name == assess_single.ai_grade;
                                                        })
                                                        factor_xl = perfor_sigle_to ? perfor_sigle_to.factor : 1;
                                                    }
                                                    break;
                                                    //按绩效得分区间
                                                case 'B':
                                                    var perfor_pep_single = _.find(perfor_data, function(temp) {
                                                        return temp._id == String(perfor_pep_id)
                                                    })
                                                    if (perfor_pep_single) {
                                                        var section_data = perfor_pep_single.factor_items.score_section;
                                                        var perfor_sigle_to = _.find(section_data, function(temp) {
                                                            return temp.score_low_value <= assess_single.ai_score && temp.score_high_value > assess_single.ai_score;
                                                        })
                                                        factor_xl = perfor_sigle_to ? perfor_sigle_to.factor : 1;
                                                    }
                                                    break;
                                            }
                                            var perfor_org_single = _.find(perfor_data, function(temp) {
                                                return temp._id == String(perfor_org_id)
                                            })
                                            if (perfor_org_single) {
                                                var org_category = perfor_org_single.org_category;
                                                switch (org_category) {
                                                    case 'M':
                                                        switch (perfor_org_detail) {
                                                            //按绩效等级
                                                            case 'A':
                                                                var grades_data = perfor_org_single.factor_items.grades;
                                                                var perfor_sigle_to = _.find(grades_data, function(temp) {
                                                                    return temp.grade_name == manager_single_temp.ai_grade;
                                                                })
                                                                factor_xr = perfor_sigle_to ? perfor_sigle_to.factor : 1;
                                                                break;
                                                                //按绩效得分区间
                                                            case 'B':
                                                                var section_data = perfor_org_single.factor_items.score_section;
                                                                var perfor_sigle_to = _.find(section_data, function(temp) {
                                                                    return temp.score_low_value <= manager_single_temp.ai_score && temp.score_high_value > manager_single_temp.ai_score;
                                                                })
                                                                factor_xr = perfor_sigle_to ? perfor_sigle_to.factor : 1;
                                                                break;
                                                            case 'C':
                                                                var obj_score_data = perfor_org_single.factor_items.obj_section;
                                                                var perfor_sigle_to = _.find(obj_score_data, function(temp) {
                                                                    return temp.score_low_value <= obj_score_temp && temp.score_high_value > obj_score_temp;
                                                                })
                                                                factor_xr = perfor_sigle_to ? perfor_sigle_to.factor : 1;
                                                                break;
                                                        }
                                                        break;
                                                    case 'A':
                                                        switch (perfor_org_detail) {
                                                            //按绩效等级
                                                            case 'A':
                                                                var grades_data = perfor_org_single.factor_items.grades;
                                                                var perfor_sigle_to = _.find(grades_data, function(temp) {
                                                                    return temp.grade_name == divide_score_grade;
                                                                })
                                                                factor_xr = perfor_sigle_to ? perfor_sigle_to.factor : 1;
                                                                break;
                                                                //按绩效得分区间
                                                            case 'B':
                                                                var section_data = perfor_org_single.factor_items.score_section;
                                                                var perfor_sigle_to = _.find(section_data, function(temp) {
                                                                    return temp.score_low_value <= divide_score && temp.score_high_value > divide_score;
                                                                })
                                                                factor_xr = perfor_sigle_to ? perfor_sigle_to.factor : 1;
                                                                break;
                                                            case 'C':
                                                                var obj_score_data = perfor_org_single.factor_items.obj_section;
                                                                var perfor_sigle_to = _.find(obj_score_data, function(temp) {
                                                                    return temp.score_low_value <= divide_obj_score && temp.score_high_value > divide_obj_score;
                                                                })
                                                                factor_xr = perfor_sigle_to ? perfor_sigle_to.factor : 1;
                                                                break;
                                                        }
                                                        break;
                                                }
                                            }
                                            obj[assess_single._id] = Math.round((factor_xl * factor_xr) * 100) / 100;
                                            break;
                                            //组合系数 加权求和

                                        case 'C':
                                            var perfor_pep_id = swap_data.people_data.factor;
                                            var perfor_pep_weight = swap_data.people_data.weight;
                                            var perfor_org_weight = swap_data.org_data.weight;
                                            var perfor_org_id = swap_data.org_data.factor;
                                            var perfor_pep_detail = swap_data.people_data.factor_detail;
                                            var perfor_org_detail = swap_data.org_data.factor_detail;
                                            var factor_xl = 0,
                                                factor_xr = 0;
                                            switch (perfor_pep_detail) {
                                                //按绩效等级
                                                case 'A':
                                                    var perfor_pep_single = _.find(perfor_data, function(temp) {
                                                        return temp._id == String(perfor_pep_id)
                                                    })
                                                    if (perfor_pep_single) {
                                                        var grades_data = perfor_pep_single.factor_items.grades;
                                                        var perfor_sigle_to = _.find(grades_data, function(temp) {
                                                            return temp.grade_name == assess_single.ai_grade;
                                                        })
                                                        factor_xl = perfor_sigle_to ? perfor_sigle_to.factor : 1;
                                                    }
                                                    break;
                                                    //按绩效得分区间
                                                case 'B':
                                                    var perfor_pep_single = _.find(perfor_data, function(temp) {
                                                        return temp._id == String(perfor_pep_id)
                                                    })
                                                    if (perfor_pep_single) {
                                                        var section_data = perfor_pep_single.factor_items.score_section;
                                                        var perfor_sigle_to = _.find(section_data, function(temp) {
                                                            return temp.score_low_value <= assess_single.ai_score && temp.score_high_value > assess_single.ai_score;
                                                        })
                                                        factor_xl = perfor_sigle_to ? perfor_sigle_to.factor : 1;
                                                    }
                                                    break;
                                            }
                                            var perfor_org_single = _.find(perfor_data, function(temp) {
                                                return temp._id == String(perfor_org_id)
                                            })
                                            if (perfor_org_single) {
                                                var org_category = perfor_org_single.org_category;
                                                switch (org_category) {
                                                    case 'M':
                                                        switch (perfor_org_detail) {
                                                            //按绩效等级
                                                            case 'A':
                                                                var grades_data = perfor_org_single.factor_items.grades;
                                                                var perfor_sigle_to = _.find(grades_data, function(temp) {
                                                                    return temp.grade_name == manager_single_temp.ai_grade;
                                                                })
                                                                factor_xr = perfor_sigle_to ? perfor_sigle_to.factor : 1;
                                                                break;
                                                                //按绩效得分区间
                                                            case 'B':
                                                                var section_data = perfor_org_single.factor_items.score_section;
                                                                var perfor_sigle_to = _.find(section_data, function(temp) {
                                                                    return temp.score_low_value <= manager_single_temp.ai_score && temp.score_high_value > manager_single_temp.ai_score;
                                                                })
                                                                factor_xr = perfor_sigle_to ? perfor_sigle_to.factor : 1;
                                                                break;
                                                            case 'C':
                                                                var obj_score_data = perfor_org_single.factor_items.obj_section;
                                                                var perfor_sigle_to = _.find(obj_score_data, function(temp) {
                                                                    return temp.score_low_value <= obj_score_temp && temp.score_high_value > obj_score_temp;
                                                                })
                                                                factor_xr = perfor_sigle_to ? perfor_sigle_to.factor : 1;
                                                                break;
                                                        }
                                                        break;
                                                    case 'A':
                                                        switch (perfor_org_detail) {
                                                            //按绩效等级
                                                            case 'A':
                                                                var grades_data = perfor_org_single.factor_items.grades;
                                                                var perfor_sigle_to = _.find(grades_data, function(temp) {
                                                                    return temp.grade_name == divide_score_grade;
                                                                })
                                                                factor_xr = perfor_sigle_to ? perfor_sigle_to.factor : 1;
                                                                break;
                                                                //按绩效得分区间
                                                            case 'B':
                                                                var section_data = perfor_org_single.factor_items.score_section;
                                                                var perfor_sigle_to = _.find(section_data, function(temp) {
                                                                    return temp.score_low_value <= divide_score && temp.score_high_value > divide_score;
                                                                })
                                                                factor_xr = perfor_sigle_to ? perfor_sigle_to.factor : 1;
                                                                break;
                                                            case 'C':
                                                                var obj_score_data = perfor_org_single.factor_items.obj_section;
                                                                var perfor_sigle_to = _.find(obj_score_data, function(temp) {
                                                                    return temp.score_low_value <= divide_obj_score && temp.score_high_value > divide_obj_score;
                                                                })
                                                                factor_xr = perfor_sigle_to ? perfor_sigle_to.factor : 1;
                                                                break;
                                                        }
                                                        break;
                                                }
                                            }
                                            obj[assess_single._id] = Math.round((factor_xl * (perfor_pep_weight / 100) + factor_xr * (perfor_org_weight / 100)) * 100) / 100;
                                            break;
                                    }
                                    n(null, obj)
                                } else {
                                    n(null, null)
                                }

                            }, cb)
                        } else {
                            cb(null, null)
                        }
                    }
                },
                display_data: function(cb) {
                    cond.ai_status = {
                        $in: status_arr
                    }
                    AssessmentInstance.find(cond)
                        .populate('people position ou company')
                        .sort(sort_cond).skip(iDisplayStart).limit(iDisplayLength)
                        .exec(function(err, result) {
                            cb(null, result)
                        })
                },
                total: function(cb) {
                    AssessmentInstance.count(cond, cb);
                }
            }, cb)
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
            row.push(x.people.ou_name)
            var ai_score = Math.round(x.ai_score * 100) / 100;
            row.push(ai_score);
            row.push(x.ai_grade || '');
            row.push(x.ai_forced_distribution_grade || '');
            row.push(result.obj_data[0] ? result.obj_data[0][x._id] : 1)
            tblData.push(row);
        });
        return res.json({
            code: 'OK',
            sEcho: sEcho,
            iTotalRecords: result.total || 0,
            iTotalDisplayRecords: result.total || 0,
            aaData: tblData,
        })
    })
}
var run_pep_factor_form = function(req, res) {
    var client = req.user.client.id;
    var render_data = {
        title: '人员系数计算',
        user: req.user,
        _: us
    };
    render_data.moment = moment;
    res.render('admin/pm/performance_payroll_factor/temp_run', render_data);

}
var factor_panel = function(req, res) {
    var i18n = req.i18n;
    var client = req.user.client.id;
    var render_data = {
        title: '绩效薪酬',
        user: req.user,
    };
    res.render('admin/py/panel_p', render_data)

}
module.exports = function(app, checkAuth) {
    var __base_path = '/admin/pm/performance_payroll_factor';
    //列表界面
    app.get(__base_path + '/list', checkAuth, performance_payroll_facotr_list);
    app.get(__base_path + '/bbform', checkAuth, performance_payroll_facotr_bb_form); //表单
    app.get(__base_path + '/bb', checkAuth, performance_payroll_facotr_bb_list); //列表界面
    app.get(__base_path + '/grade_bb', checkAuth, performance_payroll_facotr_grade_bb); //列表界面
    app.get(__base_path + '/bb/:up_id', checkAuth, performance_factor_bb_fetch); //获取
    app.post(__base_path + '/bb/:up_id', checkAuth, performance_factor_bb_create); //新建的保存
    app.put(__base_path + '/bb/:up_id', checkAuth, performance_factor_bb_update); //更新的保存
    app.delete(__base_path + '/bb/:up_id', checkAuth, performance_factor_bb_delete); //删除
    //系数组合配置
    app.get(__base_path + '/com_list', checkAuth, performance_payroll_facotr_com_list);
    app.get(__base_path + '/com_bbform', checkAuth, performance_payroll_facotr_com_bb_form); //表单
    app.get(__base_path + '/com_bb', checkAuth, performance_payroll_facotr_com_bb_list); //列表界面
    app.get(__base_path + '/com_bb/:up_id', checkAuth, performance_factor_com_bb_fetch); //获取
    app.post(__base_path + '/com_bb/:up_id', checkAuth, performance_factor_com_bb_create); //新建的保存
    app.put(__base_path + '/com_bb/:up_id', checkAuth, performance_factor_com_bb_update); //更新的保存
    app.delete(__base_path + '/com_bb/:up_id', checkAuth, performance_factor_com_bb_delete); //删除
    app.post(__base_path + '/del_list', checkAuth, performance_factor_com_bb_del); //删除
    //人员绩效工资系数赋予
    app.get(__base_path + '/pep_list', checkAuth, performance_factor_pep);
    app.get(__base_path + '/people_help_json/:p_type', checkAuth, people_help_json);
    app.get(__base_path + '/factor_list', checkAuth, people_performance_list)
    app.get(__base_path + '/position_help_json/:c_type', checkAuth, position_help_json);
    app.post(__base_path + '/people_get_factor', checkAuth, people_get_factor);
    app.get(__base_path + '/edit', checkAuth, people_factor_single_edit);
    app.get(__base_path + '/input_help', checkAuth, people_factor_input_help);
    app.post(__base_path + '/del', checkAuth, people_factor_del);

    //人员绩效工资系数单个编辑
    app.get(__base_path + '/factor_bb', checkAuth, performance_payroll_facotr_pep_bb_list); //列表界面
    app.put(__base_path + '/factor_bb/:factor_id', checkAuth, performance_factor_pep_bb_update); //更新的保存
    app.get(__base_path + '/factor_bb/:factor_id', checkAuth, performance_factor_pep_bb_fetch); //获取
    //人员系数计算程序
    app.post(__base_path + '/factor', checkAuth, run_pep_factor);
    app.get(__base_path + '/factor_run', checkAuth, run_pep_factor_form);
    app.get(__base_path + '/panel', checkAuth, factor_panel);

}
