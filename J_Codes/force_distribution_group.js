printf = require('sprintf').sprintf;
var ForceDistributionGroup = require('../../models/pm').ForceDistributionGroup;
var ForceDistributionRule = require('../../models/pm').ForceDistributionRule;

var OrganizationUnit = require('../../models/organization').OrganizationUnit;
var Position = require('../../models/position').Position;

var async = require('async');
var us = require('underscore');
var Company = require('../../models/structure').Company;
var PointsSystemClient = require('../../models/pm').PointsSystemClient;

var People = require('../../models/people').People;
var fs = require('fs');
var point_id;
var point_new_id;
//人数分布区间规则列表
var force_distribution_rule_list = function(req, res) {
    var i18n = req.i18n;
    var client = req.user.client.id;
    var render_data = {
        title: '自定义人员分组－列表查看',
        user: req.user,
        modi_type: 'add'
    };
    ForceDistributionRule.find({
        client: client
    }).populate('force_distribution_group points_system').exec(function(err, result) {
        if (err) {
            req.app.locals.handle500(err, req, res);
        };
        render_data.result = result;
        render_data._ = us;
        res.render('admin/pm/force_distribution_group/rule_list', render_data);

    })


}
//自定义强制分布分组列表
var force_distribution_group_list = function(req, res) {
    var i18n = req.i18n;
    var client = req.user.client.id;
    var render_data = {
        title: '自定义人员分组－列表查看',
        user: req.user,
        modi_type: 'add'
    };
    ForceDistributionGroup.find({
        client: client,
    }).populate('companies organizations manager_positions').exec(function(err, result) {
        if (err) {
            req.app.locals.handle500(err, req, res);
        };
        render_data.force_distribution_group = result;
        render_data.us = us;
        res.render('admin/pm/force_distribution_group/list', render_data);

    })


}
//人数分布区间规则 form
var force_distribution_rule_form = function(req, res) {
    var i18n = req.i18n;
    var client = req.user.client.id;
    var render_data = {
        title: '自定义人数等级分布－列表查看',
        user: req.user,
        modi_type: 'add'
    };
    async.parallel({
        ps: function(cb) {
            PointsSystemClient.find({
                client: client,
                activate: true,
                block: false,
                terminated: false
            }).exec(cb)
        },
        fdg: function(cb) {
            ForceDistributionGroup.find({
                client: client,
            }).populate('companies organizations manager_positions').exec(cb)
        }
    }, function(err, result) {
        if (err) {
            req.app.locals.handle500(err, req, res);
        };
        var ps = result.ps;
        var force_distribution_group = result.fdg;
        render_data.pointsystem = ps;
        render_data.force_distribution_group = force_distribution_group;
        render_data.us = us;
        res.render('admin/pm/force_distribution_group/rule_form', render_data);

    })


}
//人数分布区间规则 save
var force_distribution_rule_add_save = function(req, res) {
    var i18n = req.i18n;
    var render_data = {
        title: '人数等级分布－新增',
        user: req.user,
        modi_type: 'add'
    };
    var client = req.user.client.id;
    // var force_distribution_group = JSON.parse(req.body.force_distribution_group)
    // var force_distribution_group=String(req.body.force_distribution_group).split(',')||''  ;
    var datacreate = {
        client: client,
        rule_name: req.body.rule_name,
        rule_descript: req.body.rule_descript,
        force_data: JSON.parse(req.body.force_data),
        // force_distribution_group: force_distribution_group,
        points_system: req.body.points_system
    };
    ForceDistributionRule.findOne({
        client: client,
        rule_name: req.body.rule_name
    }).exec(function(err, result) {
        if (result) {
            return res.json({
                code: 'ERR',
                msg: '该名称已存在，请重新添加!!!'
            })
        } else {
            ForceDistributionRule.create(datacreate, function(err, rule) {
                if (err) {
                    return res.json({
                        code: 'ERR',
                        msg: '内部服务器错误：' + err
                    });
                };
                if (rule) {
                    return res.json({
                        code: 'OK',
                        msg: sprintf('人数等级分布<strong>%s</strong> 创建成功！', rule.rule_name),
                    });
                } else {
                    return res.json({
                        code: 'ERR',
                        msg: '人数等级分布创建失败！'
                    });
                }
            })
        }
    })
}
//人数分布区间规则 详细设置
var force_distribution_list_search = function(req, res) {
    var client = req.user.client.id;
    var rule_name = req.body.rule_name;
    ForceDistributionRule.findOne({
        client: client,
        rule_name: rule_name
    }).populate('points_system').exec(function(err, result) {
        if (err) {
            return res.json({
                code: 'ERR',
                msg: '内部服务器错误：' + err
            });
        };
        if (result) {
            var grade_data = result.points_system.grades;
            var force_data = result.force_data;
            return res.json({
                code: 'OK',
                msg: '数据发送成功!',
                data: grade_data,
                force_data: force_data,
                rule_name: rule_name
            })
        }

    })
}
//人数分布区间规则 data
var force_rule_data = function(req, res) {
    var client = req.user.client.id;
    var points_system_id = req.body.point_id;
    PointsSystemClient.findById(points_system_id).exec(function(err, result) {
        if (err) {
            res.json({
                code: 'ERR',
                msg: '内部服务器错误：' + err
            });
        }
        if (result) {
            var grades = result.grades;
            return res.json({
                code: 'OK',
                msg: 'data is send success',
                data: grades
            })
        }
    })
}
var force_rule_data2 = function(req, res) {
    var client = req.user.client.id;
    var rule_id = req.body.rule_id;
    ForceDistributionRule.findById(rule_id).populate('points_system').exec(function(err, result) {
        if (err) {
            res.json({
                code: 'ERR',
                msg: '内部服务器错误：' + err
            });
        }
        if (result) {
            var grade_data = result.points_system.grades;
            var force_data = result.force_data;
            return res.json({
                code: 'OK',
                msg: '数据发送成功!',
                data: grade_data,
                force_data: force_data,
            })
        }
    })
}
//人数分布区间规则 edit
var force_distribution_rule_edit_form = function(req, res) {
    var rule_id = req.params.rule_id;
    var i18n = req.i18n;
    var client = req.user.client.id;
    var render_data = {
        title: '自定义人数等级分布－编辑',
        user: req.user,
        modi_type: 'edit',
        _:us
    };
    async.parallel({
        ps: function(cb) {
            PointsSystemClient.find({
                client: client,
                activate: true,
                block: false,
                terminated: false
            }).exec(cb)
        },
        fdr: function(cb) {
            ForceDistributionRule.findById(rule_id).populate('points_system').exec(cb)
        },
        fdg: function(cb) {
            ForceDistributionGroup.find({
                client: client
            }).populate('companies manager_positions organizations').exec(cb)
        },
        positions: function(cb) {
            Position.find({
                client: client,
                position_manager: true,
            }).sort({
                position_code: 1
            }).exec(cb)
        },
        com: function(cb) {
            Company.find({
                client: client,
                _id: {
                    $in: req.user.companies
                }
            }).exec(function(err, result) {
                var item1 = [],
                    item2 = [];
                us.each(result, function(temp) {
                    item1.push(temp.id);
                    item2.push(temp.company_name);
                })
                var com_object = us.object(item1, item2);
                cb(null, com_object);
            })
        },
        organizationunits: function(cb) {
            OrganizationUnit.find({
                client: client,
                block: false,
                activate: true,
                terminated: false
            }).sort({
                ou_code: 1
            }).exec(cb)
        }
    }, function(err, force_distribution_group) {
        if (err) {
            return res.json({
                code: 'ERR',
                msg: '内部服务器错误：' + err
            });
        }
        if (force_distribution_group) {
            var rule = force_distribution_group.fdr;
            var ps_data = force_distribution_group.ps;
            var org_data = force_distribution_group.organizationunits;
            var group_data = force_distribution_group.fdg;
            var position_data = force_distribution_group.positions;
            var com_data = force_distribution_group.com;
            var org_obj = {}, position_obj = {};
            var obj = {};
            us.each(org_data, function(temp) {
                org_obj[temp.id] = temp.ou_name;
            })
            us.each(position_data, function(temp) {
                position_obj[temp.id] = temp.position_name;
            })
            us.each(ps_data, function(temp) {
                obj[temp.id] = temp.points_system_name;
            })
            render_data.obj = obj;
            render_data.org_obj = org_obj;
            render_data.position_obj = position_obj;
            render_data.com_data = com_data;
            // render_data.group_id = rule.force_distribution_group;
            render_data.group_data = group_data;
            render_data.rule_data = rule;
            res.render('admin/pm/force_distribution_group/rule_form', render_data);
        } else {
            res.render('admin/pm/force_distribution_group/rule_form', render_data);
        }
    })
}
//人数分布区间规则 edit save
var force_distribution_rule_edit_save = function(req, res) {
    var i18n = req.i18n;
    var client = req.user.client.id;
    var rule_id = req.body.rule_id;
    // var force_distribution_group = JSON.parse(req.body.force_distribution_group)
    var datacreate = {
        client: client,
        rule_name: req.body.rule_name,
        rule_descript: req.body.rule_descript,
        force_data: JSON.parse(req.body.force_data),
        // force_distribution_group: force_distribution_group,
        points_system: req.body.points_system
    };
    ForceDistributionRule.findByIdAndUpdate(rule_id, datacreate, function(err, rule) {
        if (err) {
            return res.json({
                code: 'ERR',
                msg: '数据更改失败!!!'
            })
        } else {
            return res.json({
                code: 'OK',
                msg: sprintf('人数等级分布<strong>%s</strong> 修改成功！', rule.rule_name),
            });
        }
    })
}
//人数分布区间规则 del
var force_distribution_rule_del = function(req, res) {
    var i18n = req.i18n;
    var client = req.user.client.id;
    var rule_id = req.body.rule_id;
    ForceDistributionRule.findByIdAndRemove(rule_id, function(err, rule) {
        if (err) {
            return res.json({
                code: 'ERR',
                msg: '删除失败!!!'
            })
        } else {
            return res.json({
                code: 'OK',
                msg: sprintf('人数等级分布<strong>%s</strong> 删除成功！', rule.rule_name),
            });
        }
    })
}
//强制分布自定义组 add form
var force_distribution_group_add_form = function(req, res) {
    var i18n = req.i18n;
    var render_data = {
        title: '自定义强制分布组－新增',
        user: req.user,
        modi_type: 'add'
    };
    return res.render('admin/pm/force_distribution_group/form', render_data);
}
//强制分布自定义组 add save
var force_distribution_group_add_save = function(req, res) {
    var i18n = req.i18n;
    var client = req.user.client.id;
    var datacreate = {
        client: client,
        group_name: req.body.group_name,
        group_descript: req.body.group_descript,
        companies: JSON.parse(req.body.companies),
        organizations: JSON.parse(req.body.organizations),
        manager_positions: JSON.parse(req.body.manager_positions),
    };
    ForceDistributionGroup.findOne({
        client: client,
        group_name: req.body.group_name
    }).exec(function(err, result) {
        if (result) {
            return res.json({
                code: 'ERR',
                msg: '该分布组名称已存在，请重新添加!!!'
            })
        } else {
            ForceDistributionGroup.create(datacreate, function(err, force_distribution_group) {
                if (err) {
                    return res.json({
                        code: 'ERR',
                        msg: '内部服务器错误：' + err
                    });
                };
                if (force_distribution_group) {
                    return res.json({
                        code: 'OK',
                        msg: sprintf('人员分组<strong>%s</strong> 创建成功！', force_distribution_group.group_name),
                    });
                } else {
                    return res.json({
                        code: 'ERR',
                        msg: '人员分组创建失败！'
                    });
                }
            })
        }
    })


}
//强制分布自定义组 edit form 
var force_distribution_group_edit_form = function(req, res) {
    var group_id = req.params.group_id;
    var i18n = req.i18n;
    var render_data = {
        title: '自定义人员分组－编辑',
        user: req.user,
        modi_type: 'edit'
    };
    ForceDistributionGroup.findById(group_id).populate('companies organizations manager_positions').exec(function(err, force_distribution_group) {
        if (err) {
            return res.json({
                code: 'ERR',
                msg: '内部服务器错误：' + err
            });
        }
        if (force_distribution_group) {
            render_data.force_distribution_group = force_distribution_group;
            return res.render('admin/pm/force_distribution_group/form', render_data);

        } else {
            return res.render('admin/pm/force_distribution_group/form', render_data);

        }
    })
}
//强制分布自定义组 edit save
var force_distribution_group_edit_save = function(req, res) {
    var client = req.user.client.id;
    var group_id = req.body.group_id;
    var datacreate = {
        client: client,
        group_name: req.body.group_name,
        group_descript: req.body.group_descript,
        companies: JSON.parse(req.body.companies),
        organizations: JSON.parse(req.body.organizations),
        manager_positions: JSON.parse(req.body.manager_positions),
    };
    var i18n = req.i18n;
    var render_data = {
        title: '自定义人员分组－编辑',
        user: req.user,
        modi_type: 'edit'
    };
    ForceDistributionGroup.findByIdAndUpdate(group_id, datacreate, function(err, force_distribution_group) {
        if (err) {
            return res.json({
                code: 'ERR',
                msg: '内部服务器错误：' + err
            });
        }
        if (force_distribution_group) {
            force_distribution_group.save();
            return res.json({
                code: 'OK',
                msg: sprintf('人员分组<strong>%s</strong> 修改成功！', force_distribution_group.group_name),
            });
        } else {
            return res.json({
                code: 'OK',
                msg: sprintf('人员分组<strong>%s</strong> 修改失败！', force_distribution_group.group_name),
            });
        }
    })
}
//强制分布自定义组 del
var force_distribution_group_edit_del = function(req, res) {
    var client = req.user.client.id;
    var group_id = req.body.group_id;

    function check_can_be_del(group_id, cb) {
        if (group_id) {
            ForceDistributionGroup.findById(group_id, function(err, jl) {
                if (err) {
                    return cb(err, null);
                };
                if (jl) {
                    return cb(null, jl.block);
                };
            })
        } else {
            cb(new Error('no id given!'), null);
        };
    }

    function do_del(group_id) {
        if (group_id) {
            ForceDistributionGroup.findByIdAndRemove(group_id, function(err, jd) {
                if (err) {
                    return res.json({
                        code: 'ERR',
                        msg: '人员分组删除失败！' + err
                    });
                };

                return res.json({
                    code: 'OK',
                    msg: sprintf('人员分组 <strong>%s</strong> 删除成功！', jd.group_name)
                });
            })
        } else {
            return res.json({
                code: 'ERR',
                msg: '人员分组删除失败！人员分组ID不存在！'
            });
        };
    }

    check_can_be_del(group_id, function(err, flag) {
        if (err) {
            return res.json({
                code: 'ERR',
                msg: '人员分组删除失败！' + err
            });
        };
        if (flag) {
            do_del(group_id);
        } else {
            return res.json({
                code: 'ERR',
                msg: '只有已锁定并非激活状态的纪录才能删除！'
            });
        };
    })
}
//company data for 强制分布自定义组
var com_json_data_inputhelp = function(req, res) {
    var client = req.user.client.id;
    async.waterfall([

        function(cb) {
            ForceDistributionGroup.find({
                client: client
            }).exec(function(err, result) {
                var item = [];
                us.each(result, function(temp) {
                    us.each(temp.companies, function(com) {
                        item.push(String(com))
                    })
                })
                cb(null, item)
            })
        },
        function(item, cb) {
            Company.find({
                client: client,
                _id: {
                    $in: req.user.companies
                }
            }).exec(function(err, result) {
                var com_data = us.reject(result, function(temp) {
                    return !!~item.indexOf(String(temp.id))
                })
                cb(null, com_data)
            })
        }
    ], function(err, result) {
        if (err) {
            req.app.locals.handle500(err, req, res);
        };
        res.render('admin/pm/force_distribution_config_group/company_input_help', {
            companies: result
        });
    })



}
//organizationunits data for 强制分布自定义组
var org_json_data_inputhelp = function(req, res) {
    var client = req.user.client.id;
    async.waterfall([

        function(cb) {
            ForceDistributionGroup.find({
                client: client
            }).exec(function(err, result) {
                var item = [];
                us.each(result, function(temp) {
                    us.each(temp.organizations, function(org) {
                        item.push(String(org))
                    })
                })
                cb(null, item)
            })
        },
        function(item, cb) {
            OrganizationUnit.find({
                client: client,
                block: false,
                activate: true,
                terminated: false
            }).sort({
                ou_code: 1
            }).populate('company').exec(function(err, result) {
                var org_data = us.reject(result, function(temp) {
                    return !!~item.indexOf(String(temp.id))
                })
                cb(null, org_data)
            })
        }
    ], function(err, result) {
        if (err) {
            req.app.locals.handle500(err, req, res);
        };
        res.render('admin/pm/force_distribution_config_group/ou_input_help', {
            organizationunits: result
        });
    })
}
//manager_position_data  for 强制分布自定义组
var position_json_data_inputhelp = function(req, res) {
    var client = req.user.client.id;
    async.waterfall([

        function(cb) {
            ForceDistributionGroup.find({
                client: client
            }).exec(function(err, result) {
                var item = [];
                us.each(result, function(temp) {
                    us.each(temp.manager_positions, function(pos) {
                        item.push(String(pos))
                    })
                })
                cb(null, item)
            })
        },
        function(item, cb) {
            Position.find({
                client: client,
                position_manager: true,
            }).sort({
                position_code: 1
            }).populate('company belongto_ou').exec(function(err, result) {
                var pos_data = us.reject(result, function(temp) {
                    return !!~item.indexOf(String(temp.id))
                })
                cb(null, pos_data)
            })
        }
    ], function(err, result) {
        if (err) {
            req.app.locals.handle500(err, req, res);
        };
        res.render('admin/pm/force_distribution_config_group/position_input_help', {
            positions: result,
        });
    })
}
// block or activate for 强制分布自定义组
var force_distribution_group_toggle_block = function(req, res) {
    var force_distribution_group_id = req.body.force_distribution_group_id;
    ForceDistributionGroup.findById(force_distribution_group_id, function(err, force_distribution_group) {
        if (err) {
            return res.json({
                code: 'ERR',
                msg: '内部服务器错误：' + err
            });
        };
        if (force_distribution_group) {
            var op = force_distribution_group.block ? '解锁' : '锁定';
            force_distribution_group.toggle_block();
            // force_distribution_group.activate = false; // 需要重新激活
            force_distribution_group.save();
            return res.json({
                code: 'OK',
                msg: sprintf('该分组 <strong>%s</strong> %s成功！', force_distribution_group.group_name, op),
            });
        } else {
            return res.json({
                code: 'ERR',
                msg: '该分组不存在，无法锁定/解锁。'
            });
        };
    });
}
//强制分布对象-配置列表 
var force_distribution_object_list_form = function(req, res) {
    // access i18n
    var i18n = req.i18n;
    var client = req.user.client.id;
    // var points_system_id = req.body.point_id;
    var render_data = {
        title: "强制分布规则配置-列表",
        user: req.user,
        _: us
    };
    PointsSystemClient.find({
        client: client,
        activate: true,
        block: false,
        terminated: false
    }).exec(function(err, results) {
        if (err) {
            req.app.locals.handle500(err, req, res);
        }
        if (results) {
            var obj = {};
            obj[""] = "";
            for (var i = 0; i < results.length; i++) {
                obj[results[i].id] = results[i].points_system_name;
            }
            render_data.obj = obj;
            render_data.pointsystems = results;
            if (point_id != null && point_id) {
                async.parallel({
                    fdr: function(cb) {
                        ForceDistributionRule.find({
                            client: client
                        }).exec(function(err, result) {
                            var obj = {};
                            us.each(result, function(temp) {
                                obj[temp.id] = temp.rule_name;
                            })
                            cb(null, obj)
                        })
                    },
                    company: function(cb) {
                        Company.find({
                            client: client,
                            _id: {
                                $in: req.user.companies
                            }
                        }).exec(function(err, result) {
                            var item1 = [],
                                item2 = [];
                            us.each(result, function(temp) {
                                item1.push(temp.company_name);
                                item2.push(temp.id);
                            })
                            var obj_com = us.object(item2, item1);
                            cb(null, obj_com)
                        })
                    },
                    ps: function(cb) {
                        PointsSystemClient.findById(point_id).exec(cb)
                    }

                }, function(err, result) {
                    if (err) {
                        res.json({
                            code: 'ERR',
                            msg: '内部服务器错误：' + err
                        });
                    };
                    if (result) {
                        var company_force = result.ps.company_force ? result.ps.company_force : '';
                        var company_is_force = us.filter(company_force, function(temp) {
                            return temp.if_force
                        })

                        var group_rule = us.groupBy(company_is_force, function(temp) {
                            return temp.rule_id;
                        })
                        var item1 = [];
                        us.each(company_is_force, function(temp) {
                            if (temp.rule_id) {
                                item1.push(String(temp.rule_id));
                            }
                        })
                        var item = us.uniq(item1);
                        var item2 = [],
                            item3 = [],
                            item5 = [],
                            item6 = [],
                            item7 = [];
                        us.each(item, function(temp) {
                            item2.push(temp);
                            var item4 = [];
                            item5.push(group_rule[temp][0].forced_distribution_grade_algorithm);
                            item6.push(group_rule[temp][0].is_manager_group);
                            item7.push(group_rule[temp][0].manager_group_rule);

                            us.each(group_rule[temp], function(com) {
                                item4.push(com.company)
                            })
                            item3.push(item4);
                        })
                        var rule_obj = us.object(item, item3);
                        var rule_obj2 = us.object(item, item5);
                        var rule_obj3 = us.object(item, item6);
                        var rule_obj4 = us.object(item, item7);

                        render_data.rule_data = item;
                        render_data.rule_objects = rule_obj;
                        render_data.rule_objects1 = rule_obj2;
                        render_data.rule_objects2 = rule_obj3;
                        render_data.rule_objects3 = rule_obj4;

                        render_data.company_force = company_is_force;
                        render_data.company_object = result.company;
                        render_data.rule_object = result.fdr;
                        render_data.pointsystem2 = result.ps;
                        res.render('admin/pm/force_distribution_group/object_list', render_data);

                    } else {
                        res.render('admin/pm/force_distribution_group/object_list', render_data);
                    }
                })
            } else {
                pointsystem2 = "";
                render_data.pointsystem2 = results;
                render_data.company_force = "";
                render_data.rule_data = '';
                res.render('admin/pm/force_distribution_group/object_list', render_data);

            }
        }

    })

}
//强制分布配置 add表单
var force_distribution_add_form = function(req, res) {
    // access i18n
    var i18n = req.i18n;
    var client = req.user.client.id;
    var render_data = {
        title: "强制分布规则-配置",
        user: req.user,
        modi_type: 'add'
    };
    PointsSystemClient.find({
        client: client,
        activate: true,
        block: false,
        terminated: false
    }).exec(function(err, result) {
        if (err) {
            res.json({
                code: 'ERR',
                msg: '内部服务器错误：' + err
            });
        };
        if (result) {
            render_data.pointsystem = result;

            res.render('admin/pm/force_distribution_group/force_config', render_data);

        } else {
            res.render('admin/pm/force_distribution_group/force_config', render_data);
        }


    });

}
//强制分布配置 edit form
var force_distribution_edit_form = function(req, res) {
    // access i18n
    var i18n = req.i18n;
    var client = req.user.client.id;
    var points_system_id = req.params.points_system_id;
    var rule_id = req.params.rule_id;
    var render_data = {
        title: "强制分布规则配置-编辑",
        user: req.user,
        modi_type: 'edit'
    };
    async.parallel({
            company: function(cb) {
                Company.find({
                    client: client,
                    _id: {
                        $in: req.user.companies
                    }
                }).exec(function(err, result) {
                    var item1 = [],
                        item2 = [];
                    us.each(result, function(temp) {
                        item1.push(temp.company_name);
                        item2.push(temp.id);
                    })
                    var obj_com = us.object(item2, item1);
                    cb(null, obj_com)
                })
            },
            ps: function(cb) {
                PointsSystemClient.find({
                    client: client,
                    activate: true,
                    block: false,
                    terminated: false
                }).exec(cb)
            },
            fdr: function(cb) {
                ForceDistributionRule.find({
                    client: client,
                    points_system: points_system_id
                }).exec(function(err, result) {
                    var obj = {};
                    us.each(result, function(temp) {
                        obj[temp.id] = temp.rule_name;
                    })
                    cb(null, obj)
                })
            },
        },
        function(err, result) {
            if (err) {
                res.json({
                    code: 'ERR',
                    msg: '内部服务器错误：' + err
                });
            };
            if (result) {
                var ps_da = result.ps;
                var com = result.company;
                var fdr = result.fdr;
                var ps_filter_data = us.filter(ps_da, function(temp) {
                    return temp.id == String(points_system_id);
                })
                var company_is_force = us.filter(ps_filter_data[0].company_force, function(temp) {
                    return temp.if_force
                })
                var company_data_arr = us.filter(ps_filter_data[0].company_force, function(temp) {
                    return String(rule_id) == temp.rule_id
                })
                var company_data = [];
                us.each(company_data_arr, function(temp) {
                    company_data.push(temp.company)
                })
                render_data.company_is_force = company_is_force;
                render_data.company_data = company_data;
                render_data.company_data_arr = company_data_arr;

                render_data.com = com;
                render_data.fdr = fdr;
                render_data.pointsystem = result.ps;
                render_data.points_system_id = points_system_id;
                res.render('admin/pm/force_distribution_group/force_config', render_data);

            } else {
                res.render('admin/pm/force_distribution_group/force_config', render_data);
            }


        });

}
//强制分布配置 add save form 
var force_distribution_add_save_form = function(req, res) {
    // access i18n
    var i18n = req.i18n;
    var client = req.user.client.id;
    var points_system_id = req.body.pointsystem_id;
    var target_company = String(req.body.target_company).split(',');
    var rule_id = req.body.rule_id;
    var forced_distribution_grade_algorithm = req.body.algorithm;
    var is_manager_group = req.body.is_manager_group;
    var manager_group_rule = req.body.manager_group_rule || 'E';
    PointsSystemClient.findById(points_system_id).exec(function(err, result) {
        if (err) {
            res.json({
                code: 'ERR',
                msg: '内部服务器错误：' + err
            });
        };
        if (result) {
            if (result.company_force) {
                us.each(result.company_force, function(temp) {
                    if ( !! ~target_company.indexOf(String(temp.company))) {
                        temp.rule_id = rule_id;
                        temp.manager_group_rule = manager_group_rule;
                        temp.is_manager_group = is_manager_group;
                        temp.forced_distribution_grade_algorithm = forced_distribution_grade_algorithm;
                    } else {
                        temp.rule_id = null;
                        temp.is_manager_group = !is_manager_group;
                    }
                })
                result.save();
                return res.json({
                    code: 'OK',
                    msg: '强制分布规则配置成功'
                })
            }
        } else {
            return res.json({
                code: 'ERR',
                msg: '强制分布规则配置失败'
            })
        }


    });

}
//强制分布配置 edit save form 
var force_distribution_edit_save_form = function(req, res) {
    // access i18n
    var i18n = req.i18n;
    var client = req.user.client.id;
    var points_system_id = req.body.pointsystem_id;
    var target_company = String(req.body.target_company).split(',');
    var rule_id = req.body.rule_id;
    var forced_distribution_grade_algorithm = req.body.algorithm;
    var is_manager_group = req.body.is_manager_group;
    var manager_group_rule = req.body.manager_group_rule;
    PointsSystemClient.findById(points_system_id).exec(function(err, result) {
        if (err) {
            res.json({
                code: 'ERR',
                msg: '内部服务器错误：' + err
            });
        };
        if (result) {
            if (result.company_force) {
                us.each(result.company_force, function(temp) {
                    if ( !! ~target_company.indexOf(String(temp.company))) {
                        temp.rule_id = rule_id;
                        temp.manager_group_rule = manager_group_rule;
                        temp.is_manager_group = is_manager_group;
                        temp.forced_distribution_grade_algorithm = forced_distribution_grade_algorithm;
                    } else {
                        temp.rule_id = null;
                        temp.is_manager_group = !is_manager_group;
                    }
                })
                result.save();
                return res.json({
                    code: 'OK',
                    msg: '强制分布规则配置成功'
                })
            }
        } else {
            return res.json({
                code: 'ERR',
                msg: '强制分布规则配置失败'
            })
        }


    });

}
//get the force_distribution company whose if_force is true;
var company_filter_json_data = function(req, res) {
    var client = req.user.client.id;
    var pointsystem_id = req.body.points_system_id;
    async.parallel({
        company: function(cb) {
            Company.find({
                client: client,
                _id: {
                    $in: req.user.companies
                }
            }).exec(function(err, result) {
                var item1 = [],
                    item2 = [];
                us.each(result, function(temp) {
                    item1.push(temp.company_name);
                    item2.push(temp.id);
                })
                var obj_com = us.object(item2, item1);
                cb(null, obj_com)
            })
        },
        ps: function(cb) {
            PointsSystemClient.findById(pointsystem_id).exec(cb)
        },
    }, function(err, result) {
        if (err) {
            res.json({
                code: 'ERR',
                msg: '内部服务器错误：' + err
            });
        };

        if (result) {
            var company_force = result.ps.company_force ? result.ps.company_force : '';
            var com_data = result.company ? result.company : '';
            var company_is_force = us.filter(company_force, function(temp) {
                return temp.if_force
            })
            var com_arr = [];
            us.each(company_is_force, function(temp) {
                com_arr.push(temp.company);
            })
            return res.json({
                code: 'OK',
                msg: '数据获取成功，数据在data字段中。',
                data_obj: com_data,
                data_arr: com_arr
            });
        }
    })
}
// rule data for  people force_distribution 
var rule_name_json_data = function(req, res) {
    var client = req.user.client.id;
    var pointsystem_id = req.params.points_system_id;
    ForceDistributionRule.find({
        client: client
    }).exec(function(err, result) {
        if (err) {
            res.json({
                code: 'ERR',
                msg: '内部服务器错误：' + err
            });
        };
        if (result) {
            var rule = us.filter(result, function(temp) {
                return temp.points_system == pointsystem_id;
            })
            return res.json({
                code: 'OK',
                msg: '数据获取成功，数据在data字段中。',
                data_obj: rule
            });
        }



    })
}

//强制分布配置 list------for get the point_id; gloabl variable;
var pointsystem_list2 = function(req, res) {
    point_id = req.body.point_id;
    if (point_id) {
        res.json({
            code: 'OK',
            msg: '数据发送成功',
        });
    } else {
        res.json({
            code: 'ERR',
            msg: '内部服务器错误：' + err
        });
    };
}
module.exports = function(app, checkAuth) {
    var __base_path = '/admin/pm/force_distribution_group';
    app.get(__base_path + '/rule_list', checkAuth, force_distribution_rule_list);
    app.post(__base_path + '/list2', checkAuth, pointsystem_list2);

    app.get(__base_path + '/list', checkAuth, force_distribution_group_list);
    app.get(__base_path + '/rule_form', checkAuth, force_distribution_rule_form);
    app.post(__base_path + '/rule_form', checkAuth, force_distribution_rule_add_save);
    app.post(__base_path + '/rule_list_search', checkAuth, force_distribution_list_search);
    app.get(__base_path + '/rule_edit/:rule_id', checkAuth, force_distribution_rule_edit_form);
    app.post(__base_path + '/rule_edit', checkAuth, force_distribution_rule_edit_save);

    app.get(__base_path + '/add', checkAuth, force_distribution_group_add_form);
    app.post(__base_path + '/add', checkAuth, force_distribution_group_add_save);

    app.get(__base_path + '/edit/:group_id', checkAuth, force_distribution_group_edit_form);
    app.post(__base_path + '/edit', checkAuth, force_distribution_group_edit_save);

    app.post(__base_path + '/del', checkAuth, force_distribution_group_edit_del);
    app.post(__base_path + '/rule_del', checkAuth, force_distribution_rule_del);
    app.post(__base_path + '/toggle_block', checkAuth, force_distribution_group_toggle_block)
    app.post(__base_path + '/force_rule_data', checkAuth, force_rule_data);
    app.post(__base_path + '/force_rule_data2', checkAuth, force_rule_data2);

    app.get(__base_path + '/com_json_data', checkAuth, com_json_data_inputhelp);

    app.get(__base_path + '/org_json_data', checkAuth, org_json_data_inputhelp);
    app.get(__base_path + '/position_json_data', checkAuth, position_json_data_inputhelp);
    app.get(__base_path + '/object_list', checkAuth, force_distribution_object_list_form);
    app.get(__base_path + '/object_add', checkAuth, force_distribution_add_form);
    app.post(__base_path + '/company_get_json_data', checkAuth, company_filter_json_data)
    app.post(__base_path + '/rule_name_json_data/:points_system_id', checkAuth, rule_name_json_data)
    app.post(__base_path + '/object_add', checkAuth, force_distribution_add_save_form);
    app.get(__base_path + '/object_edit/:rule_id/:points_system_id', checkAuth, force_distribution_edit_form);
    app.post(__base_path + '/object_edit', checkAuth, force_distribution_edit_save_form);


}
                                           force_distribution_config @by Ivan
