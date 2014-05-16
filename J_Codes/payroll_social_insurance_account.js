var sprintf = require('sprintf').sprintf;
var Client = require('../../models/client').Client;
var People = require('../../models/people').People;
var Nation = require('../../models/ddic').Nation;
var City = require('../../models/ddic').City;
var SocialInsurancePolicy = require('../../models/payroll').SocialInsurancePolicy;
var SocialInsuranceAccount = require('../../models/payroll').SocialInsuranceAccount;
var SocialInsuranceAccountTypeClient = require('../../models/payroll').SocialInsuranceAccountTypeClient;
var SocialInsuranceAccountAreaClient = require('../../models/payroll').SocialInsuranceAccountAreaClient;
var async = require('async');
var Company = require('../../models/structure').Company;
var us = require('underscore');
var fs = require('fs');
var path = require('path');
var exec = require('child_process').exec;
var util = require('util');
var OrganizationUnit = require('../../models/organization').OrganizationUnit;
var PayrollPeople = require('../../models/payroll').PayrollPeople;
var PayrollPackage = require('../../models/payroll').PayrollPackage;
var PayrollPeopleInstance = require('../../models/payroll').PayrollPeopleInstance;
// var socialinsuranceaccount_list = function(req, res) {
//     var i18n = req.i18n;
//     var client = req.user.client.id;
//     var render_data = {
//         title: '人员社保政策列表－列表',
//         user: req.user,
//     };
//     async.series({

//         sias: function(cb) {
//             SocialInsurancePolicy.find({
//                 client: client
//             }).populate('account_area').exec(cb)
//         },
//         policy: function(cb) {
//             SocialInsuranceAccount.find({
//                 client: client
//             }).populate('people social_policy').exec(cb)

//         },
//         types: function(cb) {
//             SocialInsuranceAccountTypeClient.find({
//                 client: client
//             }).exec(cb)
//         },
//         pep: function(cb) {
//             People.find({
//                 client: client,
//                 block: false
//             }).exec(cb)
//         }

//     }, function(err, result) {
//         var arr3 = [],
//             arr4 = [];
//         us.each(result.types, function(temp) {
//             arr3.push(temp._id)
//             arr4.push(temp.account_type);
//         })
//         var obj3 = us.object(arr3, arr4)
//         render_data.policies = result.policy;
//         render_data.siass = result.sias;
//         render_data.type_obj = obj3;
//         // ///////////
//         // var policy_pep = [];
//         // us.each(result.pep, function(temp) {
//         //     policy_pep.push(temp._id)
//         // })
//         // SocialInsuranceAccount.findOne({
//         //     client: client
//         // }).exec(function(err, social) {
//         //     if (err) {
//         //         req.app.locals.Handle500(err, req, res)
//         //     }
//         //     if (social) {
//         //         console.log(social);
//         //         var pep_id = us.filter(policy_pep, function(tem) {
//         //             return tem.id != social.people
//         //         })
//         //         us.each(pep_id, function(te) {
//         //             social.people = te;
//         //             social.save()
//         //         })
//         //     } else {
//         //         console.log('message');
//         //         us.each(policy_pep, function(te) {
//         //             var temps = {
//         //                 client: client,
//         //                 people: te
//         //             }
//         //             SocialInsuranceAccount.create(temps)
//         //         })

//         //     }
//         // })
//         res.render('admin/py/payroll_socialinsuranceaccount/list', render_data);
//     })

// }

var socialinsuranceaccount_list = function(req, res) {
    var i18n = req.i18n;
    var client = req.user.client.id;
    var render_data = {
        title: '人员社保政策列表－列表',
        user: req.user,
    };
    async.waterfall([

        function(cb) {
            async.parallel({
                siac: function(cb) {
                    SocialInsuranceAccountAreaClient.find({
                        client: client
                    }).populate('account_type').exec(cb)
                },
                pep: function(cb) {
                    People.find({
                        client: client,
                        block: false
                    }).exec(cb)
                },

            }, cb)
        },
        function(result, cb) {
            var peoples = result.pep;
            var companies = result.com;
            var siats = result.siat;
            var siacs = result.siac;
            async.times(peoples.length, function(n, next) {
                var people = peoples[n];
                var obj = {};
                obj.people = people.id;
                obj.people_no = people.people_no;
                obj.company = people.company ? people.company : "";
                obj.client = client;
                obj.nation_code = '';
                obj.nation_name = '';
                obj.province_code = '';
                obj.province_name = '';
                obj.social_policy = null;
                SocialInsuranceAccount.findOne({
                    client: client,
                    people: people._id
                }).exec(function(err, sia) {
                    if (err) {
                        req.app.locals.handle500(err, req, res);
                    }
                    if (sia) {
                        sia.people_no = people.people_no;
                        sia.save(next)
                    } else {
                        SocialInsuranceAccount.create(obj, next)
                    }
                })
            }, cb)
        }
    ], function(err, total_result) {
        async.series({

            sias: function(cb) {
                SocialInsurancePolicy.find({
                    client: client
                }).populate('account_area').exec(cb)
            },
            policy: function(cb) {
                SocialInsuranceAccount.find({
                    client: client
                }).populate('people social_policy').exec(cb)

            },
            types: function(cb) {
                SocialInsuranceAccountTypeClient.find({
                    client: client
                }).exec(cb)
            },
            pep: function(cb) {
                People.find({
                    client: client,
                    block: false
                }).exec(cb)
            }

        }, function(err, result) {
            var arr3 = [],
                arr4 = [];
            us.each(result.types, function(temp) {
                arr3.push(temp._id)
                arr4.push(temp.account_type);
            })
            var obj3 = us.object(arr3, arr4)
            render_data.policies = result.policy;
            render_data.siass = result.sias;
            render_data.type_obj = obj3;
            res.render('admin/py/payroll_socialinsuranceaccount/list', render_data);
        })
    })
}

// var socialinsuranceaccount_add_form = function(req, res) {
//     var i18n = req.i18n;
//     var client = req.user.client.id;
//     var render_data = {
//         title: '人员社保政策－新增',
//         user: req.user,
//         modi_type: 'add'
//     };
//     Nation.find({
//         client: client
//     }).exec(function(err, nations) {
//         var nation = us.find(nations, function(result) {
//             return result.nation_code == 'CN'
//         })
//         render_data.nation = nation;
//         return res.render('admin/py/payroll_socialinsuranceaccount/add', render_data)

//     })

// }
// var socialinsuranceaccount_add_save = function(req, res) {
//     var i18n = req.i18n;
//     var client = req.user.client.id;
//     var socialinsurancepolicy_id = req.body.socialinsurancepolicy_id;
//     var social_policy = req.body.social_policy;
//     var createdata = {
//         client: client,
//         social_policy: social_policy,
//         people: req.body.people,
//         nation_name: req.body.nation_name,
//         nation_code: req.body.nation_code,
//         province_code: req.body.province_code,
//         province_name: req.body.province_name,
//     }
//     SocialInsuranceAccount.create(createdata, function(err, siata) {
//         if (err) {
//             req.app.locals.handle500(err, req, res);
//         };
//         if (siata) {
//             siata.save();
//             return res.json({
//                 code: 'OK',
//                 msg: sprintf('社保政策创建成功！'),
//             });
//         } else {
//             return res.json({
//                 code: 'ERR',
//                 msg: '社保政策创建失败！'
//             });
//         }
//     })

// }
var socialinsuranceaccount_edit_form = function(req, res) {
    var i18n = req.i18n;
    var client = req.user.client.id;
    var socialinsuranceaccount_id = req.params.socialinsuranceaccount_id;
    var render_data = {
        title: '人员－社保政策－编辑',
        user: req.user,
        modi_type: 'edit'
    };
    async.parallel({
        nation: function(cb) {
            async.waterfall([

                function(cb) {
                    SocialInsuranceAccount.findById(socialinsuranceaccount_id).populate('people social_policy').exec(cb)

                },
                function(pep_id, cb) {
                    People.find({
                        client: client,
                        _id: pep_id.people
                    }).populate('it_0002').exec(cb)
                }
            ], cb)

        },
        social: function(cb) {
            SocialInsuranceAccount.findById(socialinsuranceaccount_id).populate('people social_policy').exec(cb)

        }
    }, function(err, result) {
        if (result) {
            render_data.obj = result.social;
            render_data.nation = result.nation;
            res.render('admin/py/payroll_socialinsuranceaccount/add', render_data);
        } else {
            var err = new Error('没有找到数据');
            req.app.locals.handle500(err, req, res);
        };
    })


}

var socialinsuranceaccount_edit_save = function(req, res) {
    var i18n = req.i18n;
    var client = req.user.client.id;
    var socialinsuranceaccount_id = req.body.socialinsurancepolicy_id;
    var data4update = {
        client: client,
        social_policy: req.body.social_policy,
        people: req.body.people,
        nation_name: req.body.nation_name,
        nation_code: req.body.nation_code,
        province_code: req.body.province_code,
        province_name: req.body.province_name,
        social_base: req.body.social_base,
    }
    if (socialinsuranceaccount_id) {
        SocialInsuranceAccount.findByIdAndUpdate(socialinsuranceaccount_id, data4update, function(err, socialinsuranceaccount) {

            if (err) {
                req.app.locals.handle500(err, req, res);
            };
            if (socialinsuranceaccount) {
                return res.json({
                    code: 'OK',
                    msg: sprintf('社保政策修改成功！'),
                });
            } else {
                return res.json({
                    code: 'ERR',
                    msg: sprintf('社保政策修改失败！')
                });
            };
        })
    } else {
        return res.json({
            code: 'ERR',
            msg: sprintf('社保政策：修改失败！表单数据不完整。')
        });
    };

}

var socialinsuranceaccount_del = function(req, res) {
    var i18n = req.i18n;
    var client = req.user.client.id;
    var sia_id = req.body.sia_id;
    SocialInsuranceAccount.findByIdAndRemove(sia_id, function(err, socialinsuranceaccount) {
        if (err) {
            req.app.locals.handle500(err, req, res);
        };
        if (socialinsuranceaccount) {
            return res.json({
                code: 'OK',
                msg: sprintf('社保政策删除成功！')
            });
        } else {
            return res.json({
                code: 'ERR',
                msg: 'social_insurance_account not found.'
            });
        };
    })

}
var filter_people = function(req, res) {
    var client = req.user.client.id;
    SocialInsuranceAccount.find({
        client: client,
    }).exec(function(err, social_peoples) {
        if (err) {
            req.app.locals.handle500(err, req, res);
        };
        if (social_peoples) {
            var items = [];
            us.each(social_peoples, function(social_people) {
                items.push(social_people.people)
            })
            res.json({
                people: items
            })
        };
    })
}
var filter_province = function(req, res) {
    var people_id = req.params.people_id;
    async.waterfall([

        function(cb) {
            People.findById(people_id).exec(cb)
        },
        function(company, cb) {
            Company.findById(company.company).exec(cb)
        },
        function(city, cb) {
            City.findById(city.city).populate('province').exec(cb)
        }
    ], function(err, result) {
        if (err) {
            req.app.locals.handle500(err, req, res)
        }
        if (result) {
            res.json({
                province: result.province
            })
        }

    })

}

var filter_company = function(req, res) {
    var client = req.user.client.id;
    var company = req.params.company;
    SocialInsuranceAccount.find({
        client: client,
        company: company,
    }).populate('people').exec(function(err, social_peoples) {
        if (err) {
            req.app.locals.handle500(err, req, res);
        };
        if (social_peoples) {
            var items = [];
            _.each(social_peoples, function(s) {
                if (!s.social_policy || _.isNull(s.social_base)) {
                    items.push(s.people.people_name)
                }
            })
            res.json({
                code: 'OK',
                items: items
            })
        };
    })
}
var people_help_json = function(req, res) {
    var p_type = req.params.p_type;
    var client = req.user.client;
    var cond = {
        client: client
    };
    if (p_type == 'c') {
        cond.social_policy = null;
    } else {
        cond.social_policy = {
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
                socias: function(cb) {
                    SocialInsuranceAccount.find(cond).populate('people').exec(function(err, socias) {
                        if (socias) {
                            var pps = []
                            us.each(socias, function(s) {
                                pps.push(s.people)
                            })
                            cb(null, pps)
                        };
                    })
                },
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
                    var o_p = us.filter(dc.socias, function(p) {
                        return us.isEqual(p.ou, o._id)
                    })
                    us.each(o_p, function(p) {
                        var row = {
                            'p_id': p.id,
                            'id': p.user,
                            'pId': o._id,
                            'firstname': p.firstname,
                            'lastname': p.lastname,
                            'name': p.firstname + p.lastname,
                            'code': p.people_no,
                            'company': p.company,
                            'company_name': p.company_name,
                            'ou': p.ou,
                            'ou_name': p.ou_name,
                            'position': p.position,
                            'position_name': p.position_name,
                            'type': 'p'
                        };
                        ret_data.push(row);
                    })
                })

            })

            cb(null, ret_data);
        }
    ], function(err, result) {
        res.send(result);
    })
}
var census_help_json = function(req, res) {
    var c_type = req.params.c_type;
    var client = req.user.client.id;
    var cond = {
        client: client
    };
    if (c_type == 'c') {
        cond.social_policy = null;
    } else {
        cond.social_policy = {
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
                socias: function(cb) {
                    SocialInsuranceAccount.find(cond).populate('people').exec(function(err, socias) {
                        if (socias) {
                            var pps = []
                            us.each(socias, function(s) {
                                pps.push(s.people)
                            })
                            cb(null, pps)
                        };
                    })
                },
            }, cb);
        },
        function(dc, cb) {
            var ret_data = [];
            var sx = [{
                name: '城市',
                type: 'C'
            }, {
                name: '农村',
                type: 'V'
            }]
            _.each(dc.companys, function(d) {
                var row = {
                    'id': d._id,
                    'pId': null,
                    'name': d.company_name,
                    'type': 'c'
                };
                ret_data.push(row);
                var f_ds = _.filter(dc.socias, function(s) {
                    return s.company == String(d._id)
                })
                us.each(sx, function(s) {
                    var s_row = {
                        'id': s.type + '_' + d._id,
                        'pId': d._id,
                        'name': s.name,
                        'type': 's'
                    };
                    ret_data.push(s_row);
                    var f_ys = us.filter(f_ds, function(f) {
                        return f.census_register == s.type && f.company == String(d._id)
                    })
                    us.each(f_ys, function(f) {
                        var p_row = {
                            'id': f._id,
                            'pId': s.type + '_' + d._id,
                            'name': f.people_name,
                            'type': 'p'
                        };
                        ret_data.push(p_row);
                    })
                })

            })
            cb(null, ret_data)
        }
    ], function(err, result) {
        res.send(result);
    })
}
var create_pp_social_form = function(req, res) {

    var i18n = req.i18n;
    var client = req.user.client.id;
    var socialinsuranceaccount_id = req.params.socialinsuranceaccount_id;
    var render_data = {
        title: '批量配置社保政策',
        user: req.user,
    };
    SocialInsurancePolicy.find({
        client: client
    }).populate('account_area').exec(function(err, socials) {
        if (socials) {
            render_data.socials = socials;
            res.render('admin/py/payroll_socialinsuranceaccount/create_list', render_data);
        };
    })
}



var create_pp_social = function(req, res) {
    var client = req.user.client.id;
    var policy_id = req.body.policy_id;
    var pps = JSON.parse(req.body.pps);
    var type = req.body.type;
    var msg = '配置成功！！'
    var msg_c = '配置失败！！'
    if (type == 'u') {
        msg = '修改成功！！';
        msg_c = '修改失败！！';
    };
    var o = {};
    o.social_policy = policy_id;
    async.times(pps.length, function(n, next) {
        SocialInsuranceAccount.findOneAndUpdate({
            client: client,
            people: pps[n]
        }, o, next)

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
var cmd = [
    'python',
    fs.realpathSync(__dirname + '/../../tools/genexcel.py'),
]
var temp_file = fs.realpathSync(__dirname + '/../../tools/temp.json');

var download = function(req, res) {
    var company = req.params.company;
    // console.log(company);
    async.series({
        data_json: function(cb) {
            get_down_data(company, req, res, function(data) {
                cb(null, data)
            });
        },
        json2excel: function(cb) {
            json2excel(res, function(data) {
                cb(null, data)
            })
        },
        company: function(cb) {
            Company.findById(company, cb)
        }

    }, function(err, result) {
        var str_url = result.json2excel;
        str_url = str_url.split('%n')
        var fname = encodeURIComponent(result.company.company_name + '(社保缴存基数).xls')
        res.set('Content-Disposition', 'attachment; filename="' + fname + '" ;filename*=utf-8%'%'' + fname)
        res.sendfile(String(str_url[0]));
    })
}

    function get_down_data(company, req, res, cb) {
        var pay_start_date = req.user.client.config.payroll.pay_start_date;
        var date = moment(new Date()).format('YYYY-MM');
        var validFrom = moment(date).subtract('months', 1).format('YYYY-MM-DD');
        validFrom = moment(validFrom).add('day', parseInt(pay_start_date) - 1).format('YYYY-MM-DD');
        var payroll_stop_date = moment(validFrom).add('day', parseInt(pay_start_date) - 1).format('YYYYMM');


        var client = req.user.client.id;
        async.waterfall([

            function(cb) {
                SocialInsuranceAccount.find({
                    client: client
                }).populate('people').exec(cb);
            },
            function(social_items, cb) {
                var socials = us.filter(social_items, function(p) {
                    return p.people.company == String(company)
                })
                var socials = us.filter(socials, function(temp) {
                    return (temp.people.payroll_state && !temp.people.block) || temp.people.payroll_stop_date > parseInt(payroll_stop_date)
                })

                socials = _.sortBy(socials, function(s) {
                    return parseInt(s.people.people_no)
                })
                var obj = {};
                obj.ws_name = '当前缴存基数';
                obj.data = [];
                obj.data.push({
                    row: 0,
                    col: 0,
                    text: '工号',
                }, {
                    row: 0,
                    col: 1,
                    text: '姓名',
                }, {
                    row: 0,
                    col: 2,
                    text: '当前缴存基数',
                });
                obj.col_num = 5;

                for (var i = 0; i < socials.length; i++) {
                    var social = socials[i]
                    // var row = i;
                    obj.data.push({
                        row: i + 1,
                        col: 0,
                        text: social.people.people_no,
                    });
                    obj.data.push({
                        row: i + 1,
                        col: 1,
                        text: social.people.people_name
                    });
                    obj.data.push({
                        row: i + 1,
                        col: 2,
                        text: social.social_base || null,
                    });
                };
                var rd = {};
                rd.filename = "temp.xls",
                rd.worksheets = [];
                rd.worksheets.push(obj);

                fs.writeFile('./tools/temp.json', JSON.stringify(rd), 'utf-8', function(err) {
                    if (err) {
                        return res.send({
                            'error': err
                        });
                    };
                })
                cb(null, rd)
            },
        ], function(err, result) {
            cb(result)
        })
    }

    function json2excel(res, cb) {
        ccmd = [cmd.join(' '), temp_file].join(' '); //第四步
        exec(ccmd, function(err, stdout, stderr) {
            if (err) {
                return res.send({
                    'error1': err
                });
            } else if (stderr) {
                return res.send({
                    'error2': err
                });
            };
            cb(stdout)
        })
    }

var cmd_excel = [
    'python',
    fs.realpathSync(__dirname + '/../../tools/excel2json.py'),
]
var temp_file_excel = fs.realpathSync(__dirname + '/../../tools/excel2json.json');
var social_init = function(req, res) {
    var i18n = req.i18n;
    var client = req.user.client.id;
    var import_file = req.files.qqfile.path;
    ccmd = [cmd_excel.join(' '), import_file, temp_file_excel].join(' '); //第四步
    // 调用python脚本来解析excel
    exec(ccmd, function(err, stdout, stderr) {
        fs.unlinkSync(import_file);
        if (err) {
            return res.send({
                'error': err
            });
        };
        ret = JSON.parse(fs.readFileSync(temp_file_excel, "utf-8"));
        if (ret.code == 'OK') {
            var data_objs = ret.data.worksheets;
            async.waterfall([

                function(cb) {
                    SocialInsuranceAccount.find({
                        client: client,
                    }).populate('people').exec(cb)
                },
                function(socials, cb) {
                    // console.log(socials);
                    // console.log(data_objs[0].data);
                    var data_obj = data_objs[0].data;
                    var filte_col_datas = us.filter(data_obj, function(rows) {
                        return rows.col == 0;
                    })
                    async.times(filte_col_datas.length - 1, function(n, next) {
                        var filte_col_data = filte_col_datas[n + 1];
                        console.log(filte_col_data);
                        var people_prs = us.filter(data_obj, function(pd) {
                            return pd.row == filte_col_data.row
                        })
                        console.log(people_prs);
                        var obj = {}
                        _.each(people_prs, function(p) {
                            if (p.col == 0) {
                                obj.people_no = p.text
                            } else if (p.col == 2) {
                                obj.social_base = p.text
                            };
                        })
                        next(null, obj)
                    }, function(err, pp_items) {
                        async.times(pp_items.length, function(n, next) {
                            SocialInsuranceAccount.findOne({
                                client: client,
                                people_no: pp_items[n].people_no,
                            }, function(err, social) {
                                if (social) {
                                    social.last_social_base = social.social_base;
                                    social.social_base = pp_items[n].social_base;
                                    social.save();
                                };
                                next(null, social)
                            })
                        }, cb)
                    })
                }
            ], function(err, results) {
                if (err) {
                    return res.json({
                        'error': err
                    })
                };
                return res.json({
                    'success': results,
                })
            })
        } else {
            return res.send({
                'error': '读取excel失败'
            });
        };
    });

}
var calculate_list = function(req, res) {
    var i18n = req.i18n;
    var client = req.user.client.id;
    var socialinsuranceaccount_id = req.params.socialinsuranceaccount_id;
    var render_data = {
        title: '社保缴存基数计算',
        user: req.user,
    };

    PayrollPackage.find({
        client: client,
        companies: {
            $in: req.user.companies
        }
    }).populate('pris').exec(function(err, pays) {
        var prs = [];
        _.each(pays, function(p) {
            _.each(p.pris, function(pr) {

                var f_p = _.find(prs, function(i) {
                    return i._id == String(pr._id)
                })
                if (!f_p) {
                    prs.push(pr);
                };

            })
        })
        var p_id = [];
        var p_name = [];
        _.each(prs, function(p) {
            p_id.push(p._id);
            p_name.push(p.pri_name);
        })
        render_data.payitems = _.object(p_id, p_name)
        res.render('admin/py/payroll_socialinsuranceaccount/calculate_list', render_data);
    })
}

var calculate = function(req, res) {
    var client = req.user.client.id;
    var validFrom_pp = moment(req.body.validFrom);
    var num = moment(req.body.validTo, "YYYY-MM").daysInMonth()
    var validTo_pp = moment(req.body.validTo).date(num)

    var adds = JSON.parse(req.body.adds);
    var subs = JSON.parse(req.body.subs);
    var pay_start_date = req.user.client.config.payroll.pay_start_date;

    var validFrom = moment(date).subtract('months', 1).format('YYYY-MM-DD');
    var date = moment(new Date()).format('YYYY-MM');
    validFrom = moment(validFrom).add('day', parseInt(pay_start_date) - 1).format('YYYY-MM-DD');
    var payroll_stop_date = moment(validFrom).format('YYYYMM');

    async.waterfall([

        function(cb) {
            People.find({
                client: client,
            }).exec(function(err, pep) {
                var pep_id = [];
                us.each(pep, function(temp) {
                    if (temp.payroll_state && !temp.block) {
                        pep_id.push(temp.id);
                    } else {
                        if (temp.payroll_stop_date > parseInt(payroll_stop_date)) {
                            pep_id.push(temp.id);
                        };
                    }
                })
                cb(null, pep_id)
            })
        },
        function(pep_id, cb) {
            SocialInsuranceAccount.find({
                client: client,
                people: {
                    $in: pep_id
                }
            }).populate('people').exec(cb)
        },
        function(socials, cb) {
            async.times(socials.length, function(n, next) {
                var social = socials[n];
                PayrollPeopleInstance.find({
                    client: client,
                    people: social.people._id,
                    pay_start: {
                        $lte: validTo_pp,
                        $gte: validFrom_pp
                    }
                }, function(err, ppis) {
                    var o = {};
                    o._id = social.people._id;
                    o.employee_status = social.people.employee_status;
                    o.people_no = social.people.people_no;
                    o.name = social.people.people_name;
                    o.social_base = social.social_base || 0;
                    if (ppis.length > 0) {
                        var sum = 0;
                        _.each(ppis, function(p) {
                            var a_sum = 0;
                            _.each(adds, function(a) {
                                var f_a = _.find(p.items, function(i) {
                                    return String(i.pri) == String(a)
                                })
                                if (f_a) {
                                    a_sum += f_a.amount
                                }
                            })
                            var s_sum = 0;
                            _.each(subs, function(s) {
                                var f_a = _.find(p.items, function(i) {
                                    return String(i.pri) == String(s)
                                })
                                if (f_a) {
                                    s_sum += f_a.amount
                                }
                            })
                            sum += a_sum - s_sum;
                        })
                        o.value = sum / ppis.length
                    } else {
                        o.value = 0;
                    }
                    next(null, o)
                })
            }, cb)

        },

    ], function(err, result) {
        if (err) {
            res.json({
                code: "ERR",
                msg: "计算失败！！"
            })
        };
        res.json({
            code: "OK",
            result: result,
            msg: "计算成功！！"
        })
    })
}
var update_calculate = function(req, res) {
    var results = JSON.parse(req.body.results);
    var client = req.user.client.id;
    async.times(results.length, function(n, next) {
        var f_d = {
            people: results[n]._id,
            client: client
        }
        SocialInsuranceAccount.findOneAndUpdate(f_d, {
            last_social_base: results[n].social_base,
            social_base: changeTwoDecimal(results[n].value)
        }, next)
    }, function(err, result) {
        if (err) {
            res.json({
                code: "ERR",
                msg: "更新失败！！"
            })
        };
        res.json({
            code: "OK",
            result: result,
            msg: "更新成功!!"
        })
    })

}

    function changeTwoDecimal(x) {
        var f_x = parseFloat(x);
        if (isNaN(f_x)) {
            return false;
        }
        var f_x = Math.round(x * 100) / 100;
        return f_x;
    }
module.exports = function(app, checkAuth) {
    var __base_path = '/admin/py/social_insurance_account';
    // app.get(__base_path + '/add', checkAuth, socialinsuranceaccount_add_form);
    // app.post(__base_path + '/add', checkAuth, socialinsuranceaccount_add_save);

    app.get(__base_path + '/edit/:socialinsuranceaccount_id', checkAuth, socialinsuranceaccount_edit_form);
    app.post(__base_path + '/edit', checkAuth, socialinsuranceaccount_edit_save);
    app.get(__base_path + '/list', checkAuth, socialinsuranceaccount_list);
    app.post(__base_path + '/del', checkAuth, socialinsuranceaccount_del);
    app.get(__base_path + '/filter_people', checkAuth, filter_people);
    app.get(__base_path + '/filter_province/:people_id', checkAuth, filter_province);

    app.get(__base_path + '/filter_company/:company', checkAuth, filter_company);
    //没有配置社保的部门树
    app.get(__base_path + '/people_help_json/:p_type', checkAuth, people_help_json)
    //户籍属性树
    app.get(__base_path + '/census_help_json/:c_type', checkAuth, census_help_json)
    //批量配置社保
    app.get(__base_path + '/create_pp_social_form', checkAuth, create_pp_social_form);
    app.post(__base_path + '/create_pp_social', checkAuth, create_pp_social);
    //批量更新社保
    //初始化社保基数,下载模板
    app.get(__base_path + '/download/:company', checkAuth, download);
    app.post(__base_path + '/social_init', checkAuth, social_init);
    //计算缴存基数
    app.get(__base_path + '/calculate_list', checkAuth, calculate_list);
    app.post(__base_path + '/calculate', checkAuth, calculate);
    app.post(__base_path + '/update_calculate', checkAuth, update_calculate);
}
