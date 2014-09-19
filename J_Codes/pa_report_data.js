var _ = require('underscore');
var Client = require('../models/client').Client;
var User = require('../models/user');
var PAEvent = require('../models/pa').PAEvent;
var People = require('../models/people').People;
var Company = require('../models/structure').Company;
var OrganizationUnit = require('../models/organization').OrganizationUnit;
var Position = require('../models/position').Position;
var sprintf = require('sprintf').sprintf;
var async = require('async');
var colors = require('colors');
var Position = require('../models/position').Position;
var moment = require('moment');
var EducationalBackground = require('../models/ddic').EducationalBackground;
var JobRank = require('../models/position').JobRank;
var PAReport001 = require('../models/pa').PAReport001;
var PAReport002 = require('../models/pa').PAReport002;
var PAReport003 = require('../models/pa').PAReport003;
var PAReport004 = require('../models/pa').PAReport004;
var PAReport005 = require('../models/pa').PAReport005;
var PAReport006 = require('../models/pa').PAReport006;
var PAReport007 = require('../models/pa').PAReport007;
var PAReport008 = require('../models/pa').PAReport008;
var PAReport009 = require('../models/pa').PAReport009;
var PAReport010 = require('../models/pa').PAReport010;
var util = require('util');
var i18n = require('i18next');
var JobLevel = require('../models/position').JobLevel;
/**
 * Description
 * @method copy_pa_report_05to10
 * @param {} cb
 * @return
 */
var copy_pa_report_05to10 = function(cb) {
    var src_client = 'demo01';
    var dest_client = 'demo03';
    async.waterfall([

        function(cb) {
            async.parallel({
                /**
                 * Description
                 * @method src_client
                 * @param {} cb
                 * @return
                 */
                src_client: function(cb) {
                    Client.findOne({
                        client: src_client
                    }, cb);
                },
                /**
                 * Description
                 * @method dest_client
                 * @param {} cb
                 * @return
                 */
                dest_client: function(cb) {
                    Client.findOne({
                        client: dest_client
                    }, cb);
                }
            }, cb);

        },
        function(dc, cb) {
            // console.log(dc);
            PAReport010.find({
                client: dc.src_client._id
            }).populate('company').exec(function(err, pa_data) {
                cb(err, dc, pa_data);
            });
        },
        function(dc, rp_data, cb) {
            // console.log(dc.dest_client._id);
            async.waterfall([

                function(cb) {
                    PAReport010.remove({
                        client: dc.dest_client._id
                    }, cb);
                },
                function(rp_del, cb) {
                    Company.find({
                        client: dc.dest_client._id
                    }, cb);
                },
                function(company, cb) {
                    // console.log(company);
                    async.times(rp_data.length, function(n, next) {
                        // body...
                        var data4create = _.pick(rp_data[n], 'data', 'period');
                        var old_company_code = rp_data[n].company.company_code;
                        var new_company = _.find(company, function(x) {
                            return (x.company_code == old_company_code);
                        })
                        data4create.company = new_company._id;
                        data4create.client = dc.dest_client;
                        // delete data4create._id;
                        PAReport010.create(data4create, next);
                    }, cb);
                }
            ], cb);

        }
    ], cb);
};

/**
 * Description
 * @method copy_pa_report_002
 * @param {} cb
 * @return
 */
var copy_pa_report_002 = function(cb) {
    var src_client = 'demo02';
    var dest_client = 'demo03';
    async.waterfall([

        function(cb) {
            async.parallel({
                /**
                 * Description
                 * @method src_client
                 * @param {} cb
                 * @return
                 */
                src_client: function(cb) {
                    Client.findOne({
                        client: src_client
                    }, cb);
                },
                /**
                 * Description
                 * @method dest_client
                 * @param {} cb
                 * @return
                 */
                dest_client: function(cb) {
                    Client.findOne({
                        client: dest_client
                    }, cb);
                }
            }, cb);
        },
        function(dc, cb) {
            PAReport002.find({
                client: dc.src_client._id
            }).populate('company ou').exec(function(err, pa_data) {
                cb(err, dc, pa_data);
            });

        },
        function(dc0, rp005, cb) {
            async.waterfall([

                function(cb) {
                    PAReport002.remove({
                        client: dc0.dest_client._id
                    }, cb);
                },
                function(rp0005s, cb) {
                    async.parallel({
                        /**
                         * Description
                         * @method company
                         * @param {} cb
                         * @return
                         */
                        company: function(cb) {
                            Company.find({
                                client: dc0.dest_client._id
                            }, cb);
                        },
                        /**
                         * Description
                         * @method ou
                         * @param {} cb
                         * @return
                         */
                        ou: function(cb) {
                            OrganizationUnit.find({
                                client: dc0.dest_client._id
                            }, cb);
                        }
                    }, cb);

                },
                function(dc, cb) {
                    async.times(rp005.length, function(n, next) {
                        // body...
                        var data4create = _.pick(rp005[n], 'period', 'begining_num', 'begining_sub_total', 'ending_num', 'ending_sub_total', 'average_num', 'average_sub_total', 'recruitment_num', 'recruitment_sub_total', 'inbound_num', 'inbound_sub_total', 'outbound_num', 'outbound_sub_total', 'termination_num_total', 'termination_sub_total', 'termination_num_fired', 'termination_sub_total_fired', 'termination_num_voluntary', 'termination_sub_total_voluntary', 'termination_num_retired', 'termination_sub_total_retired', 'position_qouta_full_num', 'position_qouta_full_sub_total', 'position_qouta_vacancy_num', 'position_qouta_vacancy_num_sub_total', 'position_qouta_overstrength_num', 'position_qouta_overstrength_num_sub_total');
                        console.log(data4create);
                        var old_company_code = rp005[n].company.company_code;

                        var new_company = _.find(dc.company, function(x) {
                            return (x.company_code == old_company_code);
                        })
                        data4create.company = new_company._id;

                        var old_ou_code = rp005[n].ou.ou_code;
                        var new_ou = _.find(dc.ou, function(x) {
                            return (x.ou_code == old_ou_code);
                        })
                        data4create.ou = new_ou._id;

                        data4create.client = dc0.dest_client._id;
                        // delete data4create._id;
                        PAReport002.create(data4create, next);
                    }, cb);
                }
            ], cb);

        }
    ], cb);
}
/**
 * Description
 * @method pa_report_002
 * @param {} cb
 * @return
 */
var pa_report_002 = function(cb) {
    var job_label = colors.blueBG(colors.bold('运行时长 pa_report_002'))
    console.time(job_label);
    var period = moment(new Date()).format("YYYYMM");
    var begindate = moment(new Date()).startOf('months');
    var enddate = moment(new Date()).endOf('months');
    async.waterfall([

        function(cb) {
            Client.find({
                block: false //只处理正常状态的client
            }).sort({
                client: 1
            }).exec(cb);
        },
        function(clients, cb) {
            async.times(clients.length, function(n, next) {
                var client = clients[n]._id;
                async.waterfall([

                    function(cb) {
                        Company.find({
                            client: client
                        }, cb)
                    },
                    function(companys, cb) {
                        async.times(companys.length, function(n, next) {
                            var company = companys[n]._id;
                            async.waterfall([

                                function(cb) {
                                    OrganizationUnit.find({
                                        client: client,
                                        company: company
                                    }, cb)
                                },
                                function(orgs, cb) {
                                    async.times(orgs.length, function(n, next) {
                                        var org = orgs[n]._id;
                                        async.parallel({
                                            /**
                                             * Description
                                             * @method begining_num
                                             * @param {} cb
                                             * @return
                                             */
                                            begining_num: function(cb) {
                                                People.count({
                                                    client: client,
                                                    createDate: {
                                                        '$lte': begindate
                                                    },
                                                    company: company,
                                                    ou: org
                                                }).exec(cb)
                                            },
                                            /**
                                             * Description
                                             * @method ending_num
                                             * @param {} cb
                                             * @return
                                             */
                                            ending_num: function(cb) {
                                                People.count({
                                                    client: client,
                                                    createDate: {
                                                        '$lte': enddate,
                                                    },
                                                    company: company,
                                                    ou: org
                                                }).exec(cb)
                                            },
                                            /**
                                             * Description
                                             * @method recruitment_num
                                             * @param {} cb
                                             * @return
                                             */
                                            recruitment_num: function(cb) {
                                                PAEvent.find({
                                                    client: client,
                                                    pa_event_code: 'Z1'
                                                }).populate({
                                                    path: 'people',
                                                    select: 'company ou'
                                                }).exec(function(err, paevents) {
                                                    var items = _.filter(paevents, function(paevent) {
                                                        var date = moment(paevent.createDate).format("YYYYMM");
                                                        var pae_company = String(paevent.people ? paevent.people.company : '');
                                                        // var pae_company = String(pae_company);
                                                        var pae_ou = String(paevent.people ? paevent.people.ou : '');
                                                        // var pae_ou = String(pae_ou);
                                                        return (date == period && pae_company == company && pae_ou == org)
                                                    })
                                                    cb(null, items.length);
                                                })
                                            },
                                            /**
                                             * Description
                                             * @method termination_num
                                             * @param {} cb
                                             * @return
                                             */
                                            termination_num: function(cb) {
                                                PAEvent.find({
                                                    client: client,
                                                    pa_event_code: 'Z7'
                                                }).populate({
                                                    path: 'people',
                                                    select: 'company ou'
                                                }).exec(function(err, paevents) {
                                                    var sum = 0;
                                                    var sum2 = 0;
                                                    var sum3 = 0;
                                                    var sum4 = 0;
                                                    _.each(paevents, function(paevent) {
                                                        var pae_company = String(paevent.people ? paevent.people.company : '');
                                                        var pae_ou = String(paevent.people ? paevent.people.ou : '');
                                                        var date = moment(paevent.createDate).format("YYYYMM");
                                                        var pa_reason_code = paevent.pa_reason_code;
                                                        if (date == period && pae_company == company && pae_ou == org) {
                                                            sum++
                                                        }
                                                        if (date == period && pae_company == company && pae_ou == org && pa_reason_code == '70') {
                                                            sum2++;
                                                        } else if (date == period && pae_company == company && pae_ou == org && pa_reason_code == '71') {
                                                            sum3++;
                                                        } else if (date == period && pae_company == company && pae_ou == org && pa_reason_code == '74') {
                                                            sum4++;
                                                        };

                                                    })
                                                    var obj = {};
                                                    obj.termination_num_total = sum;
                                                    obj.termination_num_voluntary = sum2;
                                                    obj.termination_num_fired = sum3;
                                                    obj.termination_num_retired = sum4;
                                                    cb(null, obj);
                                                })
                                            },
                                            /**
                                             * Description
                                             * @method position_qouta
                                             * @param {} cb
                                             * @return
                                             */
                                            position_qouta: function(cb) {
                                                async.waterfall([

                                                    function(cb) {
                                                        People.find({
                                                            client: client,
                                                            company: company,
                                                            ou: org
                                                        }).exec(cb)
                                                    },
                                                    function(peoples, cb) {
                                                        Position.find({
                                                            belongto_ou: org
                                                        }, function(err, positions) {
                                                            if (positions) {
                                                                var num = 0;
                                                                var people_num = 0;
                                                                var sum = 0;
                                                                var sum2 = 0;
                                                                var sum3 = 0;
                                                                _.each(positions, function(position) {
                                                                    num = position.position_qouta;
                                                                    var items = _.filter(peoples, function(people) {
                                                                        return position.id == people.position
                                                                    })
                                                                    people_num = parseInt(items.length);
                                                                    if (num > people_num) {
                                                                        sum++;
                                                                    } else if (num < people_num) {
                                                                        sum2++;
                                                                    } else if (num == people_num) {
                                                                        sum3++;
                                                                    };
                                                                })
                                                                var obj = {};
                                                                obj.position_qouta_vacancy_num = sum
                                                                obj.position_qouta_overstrength_num = sum2;
                                                                obj.position_qouta_full_num = sum3;

                                                                cb(null, obj)
                                                            };

                                                        })
                                                    }
                                                ], cb)
                                            }
                                        }, function(err, result) {
                                            // console.log(result);
                                            var data4create = {
                                                begining_num: result.begining_num || 0, //期初人数(自身)
                                                ending_num: result.ending_num || 0, //期末人数(自身)
                                                average_num: parseInt((result.begining_num + result.ending_num) / 2) || 0, //期间内平均人数(自身)
                                                recruitment_num: result.recruitment_num || 0, //期间内入职人数(自身)
                                                // inbound_num: result.inbound_num || 0, //期间内调入人数(自身)
                                                // outbound_num: result.outbound_num || 0, //期间内调出人数(自身)
                                                termination_num_total: result.termination_num.termination_num_total || 0, //期间内离职人数(自身)
                                                termination_num_fired: result.termination_num.termination_num_fired || 0, //期间内离职人数(辞退)(自身)
                                                termination_num_voluntary: result.termination_num.termination_num_voluntary || 0, //期间内离职人数（主动）(自身)
                                                termination_num_retired: result.termination_num.termination_num_retired || 0, //期间内离职人数（退休）(自身)
                                                position_qouta_full_num: result.position_qouta.position_qouta_full_num || 0, //期间内职位满编数(自身)
                                                position_qouta_vacancy_num: result.position_qouta.position_qouta_vacancy_num || 0, //期间内职位缺编数(自身)
                                                position_qouta_overstrength_num: result.position_qouta.position_qouta_overstrength_num || 0, //期间内职位超编数(自身)
                                            }
                                            PAReport002.findOneAndUpdate({
                                                client: client,
                                                company: company,
                                                period: period,
                                                ou: org,
                                            }, data4create, function(err, pareport002) {
                                                if (err) {
                                                    return next(err, null);
                                                };
                                                if (pareport002) {
                                                    pareport002.save(next);
                                                } else {
                                                    data4create.client = client,
                                                    data4create.company = company,
                                                    data4create.period = period,
                                                    data4create.ou = org,
                                                    PAReport002.create(data4create, function(err, pareport002) {
                                                        if (pareport002) {
                                                            pareport002.save(next);
                                                        } else {
                                                            next(null, result)
                                                        }
                                                    })
                                                }
                                            })
                                        })
                                    }, cb)
                                }
                            ], next)
                        }, cb)
                    }
                ], function(err, data) {
                    if (err) {
                        next(err, null);
                    };
                    next(null, sprintf("客户 %s %s 处理 %s 个公司数据", colors.green(clients[n].client), colors.yellow('<' + clients[n].name + '>'), colors.green(data.length)));
                })

            }, cb)
        }
    ], function(err, ret) {
        cb(err, ret);
        console.timeEnd(job_label);
    });
}

/**
 * Description
 * @method pa_report_002_sub_total
 * @param {} cb
 * @return
 */
var pa_report_002_sub_total = function(cb) {
    var job_label = colors.blueBG(colors.bold('运行时长 pa_report_002_sub_total'))
    console.time(job_label);
    var period = moment(new Date()).format("YYYYMM");
    async.waterfall([

        function(cb) {
            Client.find({
                block: false //只处理正常状态的client
            }).sort({
                client: 1
            }).exec(cb);
        },
        function(clients, cb) {
            async.times(clients.length, function(n, next) {
                var client = clients[n]._id;
                async.waterfall([

                    function(cb) {
                        Company.find({
                            client: client
                        }, cb)
                    },
                    function(companys, cb) {
                        async.times(companys.length, function(n, next) {
                            var company = companys[n]._id;
                            PAReport002.find({
                                client: client,
                                company: company,
                                period: period
                            }).populate('ou').exec(function(err, p002s) {
                                if (err) {
                                    return next(err, null);
                                };
                                if (p002s) {
                                    var data4update = {};

                                    /**
                                     * Description
                                     * @method sub_total
                                     * @param {} p002_p
                                     * @return
                                     */
                                    var sub_total = function(p002_p) {
                                        if (p002_p) {
                                            var ps = _.filter(p002s, function(p) {
                                                if (p.ou && p002_p.ou) {
                                                    return _.isEqual(p.ou.parent_ou, p002_p.ou._id);
                                                }
                                            })
                                            _.each(ps, function(p) {
                                                data4update.begining_sub_total += p.begining_num;
                                                data4update.ending_sub_total += p.ending_num;
                                                data4update.average_sub_total += p.average_num;
                                                data4update.recruitment_sub_total += p.recruitment_num;
                                                data4update.termination_sub_total += p.termination_num_total;
                                                data4update.termination_sub_total_fired += p.termination_num_fired;
                                                data4update.termination_sub_total_voluntary += p.termination_num_voluntary;
                                                data4update.termination_sub_total_retired += p.termination_num_retired;
                                                data4update.position_qouta_full_sub_total += p.position_qouta_full_num;
                                                data4update.position_qouta_vacancy_num_sub_total += p.position_qouta_vacancy_num;
                                                data4update.position_qouta_overstrength_num_sub_total += p.position_qouta_overstrength_num;
                                                sub_total(p);
                                            })
                                        }
                                    }
                                    _.each(p002s, function(p002) {
                                        data4update = {
                                            ending_sub_total: 0,
                                            begining_sub_total: 0,
                                            average_sub_total: 0,
                                            recruitment_sub_total: 0,
                                            termination_sub_total: 0,
                                            termination_sub_total_fired: 0,
                                            termination_sub_total_voluntary: 0,
                                            termination_sub_total_retired: 0,
                                            position_qouta_full_sub_total: 0,
                                            position_qouta_vacancy_num_sub_total: 0,
                                            position_qouta_overstrength_num_sub_total: 0
                                        }
                                        sub_total(p002);
                                        PAReport002.findByIdAndUpdate(p002._id, data4update, function(err, p2) {
                                            if (err) {
                                                return next(err, null);
                                            };
                                            if (p2) {
                                                p2.save();
                                            }
                                        })
                                    })
                                    next(null, p002s)
                                }
                            })
                        }, cb)
                    }
                ], function(err, data) {
                    if (err) {
                        next(err, null);
                    };
                    next(null, sprintf("客户 %s %s 处理 %s 个公司数据", colors.green(clients[n].client), colors.yellow('<' + clients[n].name + '>'), colors.green(data.length)));
                })

            }, cb)
        }
    ], function(err, ret) {
        cb(err, ret);
        console.timeEnd(job_label);
    });
}
/**
 * Description
 * @method pa_report_subordinates_total
 * @param {} cb
 * @return
 */
var pa_report_subordinates_total = function(cb) {
    var job_label = colors.blueBG(colors.bold('运行时长 pa_report_subordinates_total'))
    console.time(job_label);
    async.waterfall([

        function(cb) {
            Client.find({
                block: false //只处理正常状态的client
            }).sort({
                client: 1
            }).exec(cb);
        },
        function(clients, cb) {
            async.times(clients.length, function(n, next) {
                var client = clients[n]._id;
                async.waterfall([

                    function(cb) {
                        async.parallel({
                            /**
                             * Description
                             * @method peoples
                             * @param {} cb
                             * @return
                             */
                            peoples: function(cb) {
                                People.find({
                                    client: client
                                }).populate('position').exec(cb)
                            },
                            /**
                             * Description
                             * @method positions
                             * @param {} cb
                             * @return
                             */
                            positions: function(cb) {
                                Position.find({
                                    client: client
                                }).exec(cb)
                            }
                        }, cb)
                    },
                    function(objs, cb) {
                        var peoples = objs.peoples;
                        var positions = objs.positions;
                        if (peoples) {
                            /**
                             * Description
                             * @method subtotalPosition
                             * @param {} position
                             * @param {} sub_total
                             * @return
                             */
                            var subtotalPosition = function(position, sub_total) {
                                if (position) {
                                    var items = _.filter(positions, function(p) {
                                        return _.isEqual(p.position_direct_superior, position._id)
                                    });
                                    _.each(items, function(item) {
                                        sub_total.push(item);
                                        subtotalPosition(item, sub_total);
                                    });
                                }
                            }
                            async.times(peoples.length, function(n, next) {
                                var people = peoples[n];
                                var sub_total = [];
                                if (people.position) {
                                    subtotalPosition(people.position, sub_total);
                                }
                                var sub = _.filter(positions, function(p) {
                                    if (people.position) {
                                        return _.isEqual(p.position_direct_superior, people.position._id)
                                    }
                                });
                                async.waterfall([

                                    function(cb) {
                                        async.parallel({
                                            /**
                                             * Description
                                             * @method subordinates
                                             * @param {} cb
                                             * @return
                                             */
                                            subordinates: function(cb) {
                                                People.count({
                                                    $or: [{
                                                        position: { //全职
                                                            $in: sub
                                                        }
                                                    }, {
                                                        parttime_positions: { //兼职
                                                            $in: sub
                                                        }
                                                    }, ],
                                                    _id: {
                                                        $ne: people._id
                                                    }
                                                }).exec(cb);
                                            },
                                            /**
                                             * Description
                                             * @method total_subordinates
                                             * @param {} cb
                                             * @return
                                             */
                                            total_subordinates: function(cb) {
                                                People.count({
                                                    $or: [{
                                                        position: { //全职
                                                            $in: sub_total
                                                        }
                                                    }, {
                                                        parttime_positions: { //兼职
                                                            $in: sub_total
                                                        }
                                                    }, ],
                                                    _id: {
                                                        $ne: people._id
                                                    }
                                                }).exec(cb);
                                            }
                                        }, cb)
                                    },
                                    function(result, cb) {
                                        people.subordinates = result.subordinates;
                                        people.total_subordinates = result.total_subordinates;
                                        people.save(cb);
                                    }
                                ], next)
                            }, cb)
                        } else {
                            cb(null, null)
                        }
                    }
                ], function(err, data) {
                    if (err) {
                        next(err, null);
                    };
                    next(null, sprintf("客户 %s %s 处理 %s 个公司数据", colors.green(clients[n].client), colors.yellow('<' + clients[n].name + '>'), colors.green(data.length)));
                })

            }, cb)
        }
    ], function(err, ret) {
        cb(err, ret);
        console.timeEnd(job_label);
    });
}
/**
 * Description
 * @method pa_report_005
 * @param {} cb
 * @return
 */
var pa_report_005 = function(cb) {
    var job_label = colors.blueBG(colors.bold('运行时长 pa_report_005'))
    console.time(job_label);
    var period = moment(new Date()).format("YYYYMM");
    var begindate = moment(new Date()).startOf('months');
    var enddate = moment(new Date()).endOf('months');
    async.waterfall([

        function(cb) {
            Client.find({
                block: false //只处理正常状态的client
            }).sort({
                client: 1
            }).exec(cb);
        },
        function(clients, cb) {
            async.times(clients.length, function(n, next) {
                var client = clients[n]._id;

                async.waterfall([

                    function(cb) {
                        Company.find({
                            client: client
                        }, cb)
                    },
                    function(companys, cb) {
                        async.times(companys.length, function(n, next) {
                            var company = companys[n]._id;
                            async.waterfall([

                                function(cb) {
                                    async.parallel({
                                        /**
                                         * Description
                                         * @method educationalbackgrounds
                                         * @param {} cb
                                         * @return
                                         */
                                        educationalbackgrounds: function(cb) {
                                            EducationalBackground.find().exec(cb);
                                        },
                                        /**
                                         * Description
                                         * @method peoples
                                         * @param {} cb
                                         * @return
                                         */
                                        peoples: function(cb) {
                                            People.find({
                                                block: false,
                                                client: client,
                                                company: company,
                                            }).exec(cb)
                                        }
                                    }, cb)
                                },
                                function(objs, cb) {
                                    var eds = objs.educationalbackgrounds;
                                    var peoples = objs.peoples;
                                    var items = [];
                                    _.each(eds, function(ed) {
                                        var obj = {};
                                        obj.educationalbackground_code = ed.educationalbackground_code;
                                        obj.educationalbackground_name = ed.educationalbackground_name['zh'];
                                        var peops = _.filter(peoples, function(people) {
                                            return _.isEqual(people.educationalbackground_code, ed.educationalbackground_code);
                                        })
                                        if (peops.length > 0) {
                                            obj.count = peops.length;
                                        } else {
                                            obj.count = 0;
                                        }

                                        items.push(obj);

                                    })
                                    cb(null, items)
                                },
                                function(data, cb) {
                                    PAReport005.findOne({
                                        client: client,
                                        company: company,
                                        period: period,
                                    }, function(err, pareport005) {
                                        if (err) {
                                            cb(err, null)
                                        };
                                        if (pareport005) {
                                            pareport005.data = data;
                                            pareport005.save();
                                            cb(null, pareport005);
                                        } else {
                                            PAReport005.create({
                                                client: client,
                                                company: company,
                                                period: period,
                                                data: data,
                                            }, function(err, pa_005) {
                                                if (err) {
                                                    cb(err, null)
                                                };
                                                if (pa_005) {
                                                    pa_005.save();
                                                    cb(null, pa_005);
                                                } else {
                                                    cb(null, '保存失败');
                                                }
                                            })
                                        }
                                    })

                                }
                            ], next)
                        }, cb)
                    }
                ], function(err, data) {
                    if (err) {
                        next(err, null);
                    };
                    next(null, sprintf("客户 %s %s 处理 %s 个公司数据", colors.green(clients[n].client), colors.yellow('<' + clients[n].name + '>'), colors.green(data.length)));
                })

            }, cb)
        }
    ], function(err, ret) {
        cb(err, ret);
        console.timeEnd(job_label);
    });
};

/**
 * Description
 * @method pa_report_006
 * @param {} cb
 * @return
 */
var pa_report_006 = function(cb) {
    var job_label = colors.blueBG(colors.bold('运行时长 pa_report_006'))
    console.time(job_label);
    async.waterfall([

        function(cb) {
            Client.find({
                block: false //只处理正常状态的client
            }).sort({
                client: 1
            }).exec(cb);
        },
        function(clients, cb) {
            async.times(clients.length, function(n, next) {
                // next(null,clients[n])
                var client = clients[n]._id;
                async.waterfall([

                    function(cb) {
                        Company.find({
                            client: client
                        }, cb)
                    },
                    function(companys, cb) {

                        async.times(companys.length, function(n, next) {
                            var company = companys[n]._id;
                            async.waterfall([

                                function(cb) {
                                    var params = {};
                                    var date = moment(new Date()).format("YYYYMM");
                                    params.period = date;
                                    params.company = company;
                                    params.client = client;

                                    cb(null, params);
                                },
                                function(params, cb) {
                                    var items = [];
                                    var obj = {};
                                    var obj2 = {};
                                    var obj3 = {};
                                    var obj4 = {};
                                    var obj5 = {};
                                    var obj6 = {};
                                    var data = [];
                                    var data2 = [];
                                    var data3 = [];
                                    var data4 = [];
                                    var data5 = [];
                                    var data6 = [];
                                    var past_dates = {};
                                    var years = [25, 30, 35, 40, 45, 113];
                                    _.each(years, function(x) {
                                        past_dates[x] = moment().subtract('year', x);
                                    });
                                    util.inspect(past_dates);
                                    obj.age_range_name = '25以下';
                                    obj.birthday_range_low = moment(past_dates['25']).format('YYYY-MM-DD');
                                    obj.birthday_range_high = moment(new Date()).format('YYYY-MM-DD');
                                    People.find({
                                        client: client,
                                        company: company,
                                        employee_status: {
                                            $in: ['P', 'H']
                                        },
                                    }).exec(function(err, results) {

                                        _.map(results, function(result) {
                                            // console.log(result.birthday);
                                            // var birthday = String(result.birthday);
                                            if (result.birthday > past_dates['25']) {
                                                data.push(result.birthday);
                                            } else if (result.birthday < past_dates['25'] && result.birthday >= past_dates['30']) {
                                                data2.push(result.birthday);
                                            } else if (result.birthday < past_dates['30'] && result.birthday >= past_dates['35']) {
                                                data3.push(result.birthday);
                                            } else if (result.birthday < past_dates['35'] && result.birthday >= past_dates['40']) {
                                                data4.push(result.birthday);
                                            } else if (result.birthday < past_dates['40'] && result.birthday >= past_dates['45']) {
                                                data5.push(result.birthday);
                                            } else if (result.birthday < past_dates['45']) {
                                                data6.push(result.birthday);
                                            } else {
                                                return null;
                                            };

                                        });
                                        //the count of 25 years below
                                        var count = data.length;
                                        //the count of 25-30 years
                                        var count1 = data2.length;
                                        //the count of 30-35 years
                                        var count2 = data3.length;
                                        //the count of 35-40 years
                                        var count3 = data4.length;
                                        //the count of 40-45 years
                                        var count4 = data5.length;
                                        //the count of beyond 45 years
                                        var count5 = data6.length;
                                        obj.count = count;
                                        obj2.count = count1;
                                        obj3.count = count2;
                                        obj4.count = count3;
                                        obj5.count = count4;
                                        obj6.count = count5;

                                        obj2.age_range_name = '25-30';
                                        obj2.birthday_range_low = moment(past_dates['30']).format('YYYY-MM-DD');
                                        obj2.birthday_range_high = moment(past_dates['25']).format('YYYY-MM-DD');

                                        obj3.age_range_name = '30-35';
                                        obj3.birthday_range_low = moment(past_dates['35']).format('YYYY-MM-DD');
                                        obj3.birthday_range_high = moment(past_dates['30']).format('YYYY-MM-DD');

                                        obj4.age_range_name = '35-40';
                                        obj4.birthday_range_low = moment(past_dates['40']).format('YYYY-MM-DD');
                                        obj4.birthday_range_high = moment(past_dates['35']).format('YYYY-MM-DD');

                                        obj5.age_range_name = '40-45';
                                        obj5.birthday_range_low = moment(past_dates['45']).format('YYYY-MM-DD');
                                        obj5.birthday_range_high = moment(past_dates['40']).format('YYYY-MM-DD');

                                        obj6.age_range_name = '45以上';
                                        obj6.birthday_range_low = moment(past_dates['113']).format('YYYY-MM-DD');
                                        obj6.birthday_range_high = moment(past_dates['45']).format('YYYY-MM-DD');
                                        items.push(obj);
                                        items.push(obj2);
                                        items.push(obj3);
                                        items.push(obj4);
                                        items.push(obj5);
                                        items.push(obj6);
                                        params.item = items;
                                        cb(null, params);

                                    })
                                },
                            ], function(err, result) {
                                // console.log(result)
                                PAReport006.findOne({
                                    client: result.client,
                                    company: result.company,
                                    period: result.period,
                                }, function(err, pareport006) {
                                    if (err) {
                                        return next(err, null);
                                    };
                                    if (pareport006) {
                                        pareport006.data = result.item;
                                        pareport006.save(next);
                                    } else {
                                        PAReport006.create({
                                            client: result.client,
                                            company: result.company,
                                            period: result.period,
                                        }, function(err, pareport006) {
                                            if (pareport006) {
                                                pareport006.data = result.item;
                                                pareport006.save(next);
                                            } else {
                                                next(null, result)
                                            }
                                        })
                                    }
                                })
                            })
                        }, cb)
                    }
                ], function(err, data) {
                    if (err) {
                        next(err, null);
                    };
                    next(null, sprintf("客户 %s %s 处理 %s 个公司数据", colors.green(clients[n].client), colors.yellow('<' + clients[n].name + '>'), colors.green(data.length)));
                })

            }, cb)
        }
    ], function(err, ret) {
        cb(err, ret);
        console.timeEnd(job_label);
    });
};

/**
 * Description
 * @method pa_report_007
 * @param {} cb
 * @return
 */
var pa_report_007 = function(cb) {
    var job_label = colors.blueBG(colors.bold('运行时长 pa_report_007'))
    console.time(job_label);
    async.waterfall([

        function(cb) {
            Client.find({
                block: false //只处理正常状态的client
            }).sort({
                client: 1
            }).exec(cb);
        },
        function(clients, cb) {
            async.times(clients.length, function(n, next) {
                // next(null,clients[n])
                var client = clients[n]._id;
                async.waterfall([

                    function(cb) {
                        Company.find({
                            client: client
                        }, cb)
                    },
                    function(companys, cb) {

                        async.times(companys.length, function(n, next) {
                            var company = companys[n]._id;
                            async.waterfall([

                                function(cb) {
                                    var params = {};
                                    var date = moment(new Date()).format("YYYYMM");
                                    params.period = date;
                                    params.company = company;
                                    params.client = client;

                                    cb(null, params);
                                },
                                function(params, cb) {
                                    var items = [];
                                    var obj = {};
                                    var obj2 = {};
                                    var obj3 = {};
                                    var obj4 = {};
                                    var obj5 = {};

                                    var data = [];
                                    var data2 = [];
                                    var data3 = [];
                                    var data4 = [];
                                    var data5 = [];
                                    var data6 = [];
                                    var data7 = [];
                                    var data8 = [];
                                    var data9 = [];
                                    var data10 = [];
                                    var past_dates = {};
                                    // var years = [1, 2, 3, 5, 6, 10,113];
                                    // _.each(years, function(x) {
                                    //     past_dates[x] = moment().subtract('year', x);
                                    //     // console.log(past_dates)
                                    // });
                                    // util.inspect(past_dates);
                                    People.find({
                                        client: client,
                                        company: company
                                    }).exec(function(err, results) {

                                        _.map(results, function(result) {
                                            if (result.employee_status != "R" && result.years_of_service_client < 1) {
                                                data.push(result.years_of_service_client);
                                            } else if (result.employee_status != "R" && result.years_of_service_client <= 2 && result.years_of_service_client >= 1) {
                                                data2.push(result.years_of_service_client);
                                            } else if (result.employee_status != "R" && result.years_of_service_client >= 3 && result.years_of_service_client <= 5) {
                                                data3.push(result.years_of_service_client);
                                            } else if (result.employee_status != "R" && result.years_of_service_client >= 6 && result.years_of_service_client <= 10) {
                                                data4.push(result.years_of_service_client);
                                            } else if (result.employee_status != "R" && result.years_of_service_client > 10) {
                                                data5.push(result.years_of_service_client);
                                            };
                                            if (result.employee_status == 'R' && result.years_of_service_client < 1) {
                                                data6.push(result.years_of_service_client);
                                            } else if (result.employee_status == 'R' && result.years_of_service_client <= 2 && result.years_of_service_client >= 1) {
                                                data7.push(result.years_of_service_client);
                                            } else if (result.employee_status == 'R' && result.years_of_service_client <= 5 && result.years_of_service_client >= 3) {
                                                data8.push(result.years_of_service_client);
                                            } else if (result.employee_status == 'R' && result.years_of_service_client <= 10 && result.years_of_service_client >= 6) {
                                                data9.push(result.years_of_service_client);
                                            } else if (result.employee_status == 'R' && result.years_of_service_client > 10) {
                                                data10.push(result.years_of_service_client);
                                            } else {
                                                return;
                                            }

                                        });
                                        var count = data.length;
                                        var count1 = data2.length;
                                        var count2 = data3.length;
                                        var count3 = data4.length;
                                        var count4 = data5.length;
                                        var count5 = data6.length;
                                        var count6 = data7.length;
                                        var count7 = data8.length;
                                        var count8 = data9.length;
                                        var count9 = data10.length;
                                        obj.count = count;
                                        obj.termination_count = count5;
                                        obj2.count = count1;
                                        obj2.termination_count = count6;
                                        obj3.count = count2;
                                        obj3.termination_count = count7;
                                        obj4.count = count3;
                                        obj4.termination_count = count8;
                                        obj5.count = count4;;
                                        obj5.termination_count = count9;
                                        obj.years_of_service_client_range_name = '1年以下';
                                        obj.start_service_range_low = 0;
                                        obj.start_service_range_high = 0;
                                        obj2.years_of_service_client_range_name = '1-2年';
                                        obj2.start_service_range_low = 1;
                                        obj2.start_service_range_high = 2;

                                        obj3.years_of_service_client_range_name = '3-5年';
                                        obj3.start_service_range_low = 3;
                                        obj3.start_service_range_high = 5;

                                        obj4.years_of_service_client_range_name = '6-10年';
                                        obj4.start_service_range_low = 6;
                                        obj4.start_service_range_high = 10;

                                        obj5.years_of_service_client_range_name = '10年以上';
                                        obj5.start_service_range_low = 11;
                                        obj5.start_service_range_high = 100;
                                        items.push(obj);
                                        items.push(obj2);
                                        items.push(obj3);
                                        items.push(obj4);
                                        items.push(obj5);
                                        params.item = items;
                                        cb(null, params);

                                    })
                                },
                            ], function(err, result) {
                                // console.log(result)
                                PAReport007.findOne({
                                    client: result.client,
                                    company: result.company,
                                    period: result.period,
                                }, function(err, pareport007) {
                                    if (pareport007) {
                                        pareport007.data = result.item;
                                        pareport007.save(next);
                                    } else {
                                        PAReport007.create({
                                            client: result.client,
                                            company: result.company,
                                            period: result.period,
                                        }, function(err, pareport007) {
                                            if (err) {
                                                return next(err, null);
                                            };

                                            if (pareport007) {
                                                pareport007.data = result.item;
                                                pareport007.save(next);
                                            } else {
                                                next(null, pareport007);
                                            };
                                        })
                                    }
                                })
                            })
                        }, cb)
                    }
                ], function(err, data) {
                    if (err) {
                        next(err, null);
                    };
                    next(null, sprintf("客户 %s %s 处理 %s 个公司数据", colors.green(clients[n].client), colors.yellow('<' + clients[n].name + '>'), colors.green(data.length)));
                })

            }, cb)
        }
    ], function(err, ret) {
        cb(err, ret);
        console.timeEnd(job_label);
    });

};
/**
 * Description
 * @method pa_report_008
 * @param {} cb
 * @return
 */
var pa_report_008 = function(cb) {
    var job_label = colors.blueBG(colors.bold('运行时长 pa_report_008'))
    console.time(job_label);
    var period = moment(new Date()).format("YYYYMM");
    var begindate = moment(new Date()).startOf('months');
    var enddate = moment(new Date()).endOf('months');
    async.waterfall([

        function(cb) {
            Client.find({
                block: false //只处理正常状态的client
            }).sort({
                client: 1
            }).exec(cb);
        },
        function(clients, cb) {
            async.times(clients.length, function(n, next) {
                var client = clients[n]._id;
                //内容写下面，最后调用 next 回调函数
                async.waterfall([

                    function(cb) {
                        Company.find({
                            client: client
                        }, cb)
                    },
                    function(companys, cb) {
                        async.times(companys.length, function(n, next) {
                            var company = companys[n]._id;
                            async.waterfall([

                                function(cb) {
                                    async.parallel({
                                        /**
                                         * Description
                                         * @method JobRanks
                                         * @param {} cb
                                         * @return
                                         */
                                        JobRanks: function(cb) {
                                            JobRank.find({
                                                client: client
                                            }).populate('joblevel').exec(cb);

                                        },
                                        /**
                                         * Description
                                         * @method positions
                                         * @param {} cb
                                         * @return
                                         */
                                        positions: function(cb) {
                                            Position.find({
                                                client: client
                                            }).populate('jobrank').exec(cb);
                                        },
                                        /**
                                         * Description
                                         * @method joblevel
                                         * @param {} cb
                                         * @return
                                         */
                                        joblevel: function(cb) {
                                            JobLevel.find({
                                                client: client
                                            }).exec(cb);
                                        },
                                        /**
                                         * Description
                                         * @method Peoples
                                         * @param {} cb
                                         * @return
                                         */
                                        Peoples: function(cb) {
                                            People.find({
                                                block: false,
                                                client: client,
                                                company: company,
                                            }).exec(cb)
                                        }
                                    }, cb)
                                },
                                function(objs, cb) {

                                    var joblevels = objs.joblevel;
                                    var JobRanks = objs.JobRanks;
                                    var positions = objs.positions;
                                    var Peoples = objs.Peoples;
                                    var items = [];
                                    _.each(joblevels, function(joblevel) {
                                        var JobRank_its = _.filter(JobRanks, function(job) {
                                            return joblevel._id == job.joblevel.id;
                                        })
                                        var obj = {};
                                        obj.joblevel_code = joblevel.joblevel_code;
                                        obj.joblevel_name = joblevel.joblevel_name;
                                        if (JobRank_its.length > 0) {
                                            _.each(JobRank_its, function(JobRank_it) {
                                                var obj2 = {}
                                                var posits = _.filter(positions, function(posi) {
                                                    var jobr = posi.jobrank ? posi.jobrank.id : '';
                                                    return jobr == JobRank_it.id;
                                                })
                                                var people_its = _.filter(Peoples, function(people) {
                                                    var ss = _.filter(posits, function(po) {
                                                        return po.id == people.position
                                                    })
                                                    return ss.length > 0
                                                })
                                                obj2.joblevel_code = joblevel.joblevel_code;
                                                obj2.joblevel_name = joblevel.joblevel_name;
                                                obj2.jobrank_code = posits[0] ? posits[0].jobrank.jobrank_code : '';
                                                obj2.jobrank_name = posits[0] ? posits[0].jobrank.jobrank_name : '';
                                                obj2.count = people_its.length;
                                                items.push(obj2);

                                            })
                                        } else {
                                            obj.jobrank_code = '';
                                            obj.jobrank_name = '';
                                            obj.count = 0;
                                            items.push(obj);
                                        }

                                    })
                                    // console.log(items);
                                    cb(null, items)
                                },
                                function(data, cb) {
                                    PAReport008.findOne({
                                        client: client,
                                        company: company,
                                        period: period,
                                    }, function(err, pareport008) {
                                        if (err) {
                                            cb(err, null)
                                        };
                                        if (pareport008) {
                                            pareport008.data = data;
                                            pareport008.save();
                                            cb(null, pareport008);
                                        } else {
                                            PAReport008.create({
                                                client: client,
                                                company: company,
                                                period: period,
                                                data: data,
                                            }, function(err, pa_008) {
                                                if (err) {
                                                    cb(err, null)
                                                };
                                                if (pa_008) {
                                                    pa_008.save();
                                                    cb(null, pa_008);
                                                } else {
                                                    cb(null, '创建失败');
                                                }
                                            })
                                        }
                                    })
                                }
                            ], next)
                        }, cb)
                    }
                ], function(err, data) {
                    if (err) {
                        next(err, null);
                    };
                    next(null, sprintf("客户 %s %s 处理 %s 个公司数据", colors.green(clients[n].client), colors.yellow('<' + clients[n].name + '>'), colors.green(data.length)));
                })

            }, cb)
        }
    ], function(err, ret) {
        cb(err, ret);
        console.timeEnd(job_label);
    });
};

/**
 * Description
 * @method pa_report_009
 * @param {} cb
 * @return
 */
var pa_report_009 = function(cb) {
    var job_label = colors.blueBG(colors.bold('运行时长 pa_report_009'))
    console.time(job_label);
    async.waterfall([

        function(cb) {
            Client.find({
                block: false //只处理正常状态的client
            }).sort({
                client: 1
            }).exec(cb);
        },
        function(clients, cb) {
            async.times(clients.length, function(n, next) {
                // next(null,clients[n])
                var client = clients[n]._id;
                async.waterfall([

                    function(cb) {
                        Company.find({
                            client: client
                        }, cb)
                    },
                    function(companys, cb) {

                        async.times(companys.length, function(n, next) {
                            var company = companys[n]._id;
                            async.waterfall([

                                function(cb) {
                                    var params = {};
                                    var date = moment(new Date()).format("YYYYMM");
                                    params.period = date;
                                    params.company = company;
                                    params.client = client;

                                    cb(null, params);
                                },
                                function(params, cb) {
                                    var items = [];
                                    var obj = {};
                                    var obj1 = {};
                                    var obj2 = {};
                                    var data = [];
                                    var data1 = [];
                                    var position_condition = {
                                        client: client,
                                        company: company,
                                        employee_status: {
                                            $in: ['P', 'H']
                                        }
                                        // is_key: true,
                                        // is_knowledge: true
                                    }
                                    var sum = 0;
                                    People.find(position_condition)
                                        .populate('position')
                                        .exec(function(err, results) {
                                            _.map(results, function(result) {
                                                // to get the sum of except is_knowledge& is_key
                                                if (result.position.is_knowledge == false && result.position.is_key == false) {
                                                    sum++;
                                                };
                                                if (result.position.is_knowledge == true) {
                                                    data.push(result.position.is_knowledge);

                                                } else {
                                                    return null;
                                                };
                                                if (result.position.is_key == true) {
                                                    data1.push(result.position.is_key);

                                                } else {
                                                    return null;
                                                };
                                            })
                                            //the count of is_knowledge
                                            var count = data.length;
                                            //the count of is_key
                                            var count1 = data1.length;
                                            obj.position_attr_name = "知识型岗位";
                                            obj.position_attr_field = "is_knowledge";
                                            obj.count = count;
                                            obj1.position_attr_name = "关键岗位";
                                            obj1.position_attr_field = "is_key";
                                            obj1.count = count1;
                                            obj2.position_attr_name = "其他";
                                            obj2.position_attr_field = '';
                                            obj2.count = sum;
                                            items.push(obj);
                                            items.push(obj1);
                                            items.push(obj2);
                                            params.item = items;
                                            cb(null, params);
                                        })
                                },
                            ], function(err, result) {
                                PAReport009.findOne({
                                    client: result.client,
                                    company: result.company,
                                    period: result.period,
                                }, function(err, pareport009) {
                                    if (pareport009) {
                                        pareport009.data = result.item;
                                        pareport009.save(next);
                                    } else {
                                        PAReport009.create({
                                            client: result.client,
                                            company: result.company,
                                            period: result.period,
                                        }, function(err, pareport009) {
                                            if (err) {
                                                return next(err, null);
                                            };
                                            if (pareport009) {
                                                pareport009.data = result.item;
                                                pareport009.save(next);
                                            } else {
                                                next(null, pareport009);
                                            };
                                        })
                                    }
                                })
                            })
                        }, cb)
                    }
                ], function(err, data) {
                    if (err) {
                        next(err, null);
                    };
                    next(null, sprintf("客户 %s %s 处理 %s 个公司数据", colors.green(clients[n].client), colors.yellow('<' + clients[n].name + '>'), colors.green(data.length)));
                })

            }, cb)
        }
    ], function(err, ret) {
        cb(err, ret);
        console.timeEnd(job_label);
    });

}

/**
 * Description
 * @method pa_report_010
 * @param {} cb
 * @return
 */
var pa_report_010 = function(cb) {
    var job_label = colors.blueBG(colors.bold('运行时长 pa_report_010'))
    console.time(job_label);
    async.waterfall([

        function(cb) {
            Client.find({
                block: false //只处理正常状态的client
            }).sort({
                client: 1
            }).exec(cb);
        },
        function(clients, cb) {
            async.times(clients.length, function(n, next) {
                // next(null,clients[n])
                var client = clients[n]._id;
                async.waterfall([

                    function(cb) {
                        Company.find({
                            client: client
                        }, cb)
                    },
                    function(companys, cb) {

                        async.times(companys.length, function(n, next) {
                            var company = companys[n]._id;
                            async.waterfall([

                                function(cb) {
                                    var params = {};
                                    var date = moment(new Date()).format("YYYYMM");
                                    params.period = date;
                                    params.company = company;
                                    params.client = client;

                                    cb(null, params);
                                },
                                function(params, cb) {
                                    var items = [];
                                    var obj = {};
                                    var obj1 = {};
                                    var obj2 = {};
                                    var data = [];
                                    var data1 = [];
                                    var data2 = [];
                                    var people_condition = {
                                        client: client,
                                        company: company,
                                        employee_status: {
                                            $in: ['P', 'H']
                                        },
                                        // is_key: true,
                                        // is_knowledge: true
                                    }
                                    People.find(people_condition).exec(function(err, results) {
                                        _.map(results, function(result) {
                                            if (result.marriage_name == "未婚") {
                                                data.push(result.marriage_name);
                                            } else
                                            if (result.marriage_name == "已婚未育") {
                                                data1.push(result.marriage_name);
                                            } else if (result.marriage_name == "已婚已育") {
                                                data2.push(result.marriage_name);
                                            } else {
                                                return null;
                                            };
                                        })
                                        //the count of no_married
                                        var count = data.length;
                                        //the count of married &no_pregant
                                        var count1 = data1.length;
                                        //the count of married& pregant
                                        var count2 = data2.length;
                                        obj.marriage_code = "01";
                                        obj.marriage_name = "未婚";
                                        obj.count = count;
                                        obj1.marriage_code = "02";
                                        obj1.marriage_name = "已婚未育";
                                        obj1.count = count1;
                                        obj2.marriage_code = "03";
                                        obj2.marriage_name = "已婚已育";
                                        obj2.count = count2;
                                        items.push(obj);
                                        items.push(obj1);
                                        items.push(obj2);
                                        params.item = items;
                                        cb(null, params);
                                    })
                                },
                            ], function(err, result) {
                                PAReport010.findOne({
                                    client: result.client,
                                    company: result.company,
                                    period: result.period,
                                }, function(err, pareport010) {
                                    if (pareport010) {
                                        pareport010.data = result.item;
                                        pareport010.save(next);
                                    } else {
                                        PAReport010.create({
                                            client: result.client,
                                            company: result.company,
                                            period: result.period,
                                        }, function(err, pareport010) {
                                            if (err) {
                                                return next(err, null);
                                            };
                                            if (pareport010) {
                                                pareport010.data = result.item;
                                                pareport010.save(next);
                                            } else {
                                                next(null, pareport010);
                                            };
                                        })
                                    }
                                })
                            })
                        }, cb)
                    }
                ], function(err, data) {
                    if (err) {
                        next(err, null);
                    };
                    next(null, sprintf("客户 %s %s 处理 %s 个公司数据", colors.green(clients[n].client), colors.yellow('<' + clients[n].name + '>'), colors.green(data.length)));
                })

            }, cb)
        }
    ], function(err, ret) {
        cb(err, ret);
        console.timeEnd(job_label);
    });

}
var prepare_report = function(cb) {
    var c_date = moment().format('YYYY-MM-DD');
    var job_label = colors.blueBG(colors.bold('运行时长 prepare_report'))
    console.time(job_label);
    async.waterfall([

        function(cb) {
            Client.find({
                block: false //只处理正常状态的client
            }).sort({
                client: 1
            }).exec(cb);
        },
        function(clients, cb) {
            async.times(clients.length, function(n, next) {
                // next(null,clients[n])
                var client = clients[n]._id;
                async.parallel({
                    companys: function(cb) {
                        Company.find({
                            client: client
                        }, function(err, companys) {
                            if (companys.length > 0) {
                                async.times(companys.length, function(n, next) {
                                    Company.findById(companys[n]._id, function(err, cp) {
                                        if (cp) {
                                            var f_cs = _.filter(cp.c_preparation_planning, function(c) {
                                                return c.is_effect;
                                            })
                                            var f_c = _.find(cp.c_preparation_planning, function(c) {
                                                return !c.is_effect && !_.isUndefined(c.c_future_qouta);
                                            })
                                            if (f_c && f_c.c_ft_valid_from == c_date) {
                                                f_c.is_effect = true
                                                f_cs.push(f_c);
                                                var ob = {
                                                    c_preparation_planning: f_cs,
                                                    c_valid_from: f_c.c_ft_valid_from,
                                                    c_valid_to: f_c.c_ft_valid_to,
                                                    c_check: f_c.c_ft_check,
                                                }
                                                Company.findByIdAndUpdate(cp._id, ob, next)
                                            } else {
                                                next(null, null)
                                            }

                                        } else {
                                            next(null, null)
                                        }
                                    })

                                }, cb)
                            } else {
                                cb(null, null)
                            }
                        })
                    },
                    ous: function(cb) {
                        OrganizationUnit.find({
                            client: client
                        }, function(err, ous) {
                            if (ous.length > 0) {
                                async.times(ous.length, function(n, next) {
                                    OrganizationUnit.findById(ous[n]._id, function(err, ou) {
                                        if (ou) {
                                            var f_os = _.filter(ou.ou_preparation_planning, function(o) {
                                                return o.is_effect;
                                            })
                                            var f_o = _.find(ou.ou_preparation_planning, function(o) {
                                                return !o.is_effect && !_.isUndefined(o.ou_future_qouta);
                                            })
                                            if (f_o && f_o.ou_ft_valid_from == c_date) {
                                                f_o.is_effect = true
                                                f_os.push(f_o);
                                                var ob = {
                                                    ou_preparation_planning: f_os,
                                                    ou_valid_from: f_o.ou_ft_valid_from,
                                                    ou_valid_to: f_o.ou_ft_valid_to,
                                                    ou_check: f_o.ou_ft_check,
                                                }
                                                OrganizationUnit.findByIdAndUpdate(ou._id, ob, next)
                                            } else {
                                                next(null, null)
                                            }

                                        } else {
                                            next(null, null)
                                        }
                                    })

                                }, cb)
                            } else {
                                cb(null, null)
                            }
                        })
                    },
                    positions: function(cb) {
                        Position.find({
                            client: client
                        }, function(err, positions) {
                            if (positions.length > 0) {
                                async.times(positions.length, function(n, next) {
                                    Position.findById(positions[n]._id, function(err, ps) {
                                        if (ps) {
                                            var f_ps = _.filter(ps.position_preparation_planning, function(p) {
                                                return p.is_effect;
                                            })
                                            var f_p = _.find(ps.position_preparation_planning, function(p) {
                                                return !p.is_effect && !_.isUndefined(p.position_future_qouta);
                                            })
                                            if (f_p && f_p.position_ft_valid_from == c_date) {
                                                f_p.is_effect = true
                                                f_ps.push(f_p);
                                                var ob = {
                                                    position_preparation_planning: f_ps,
                                                    position_qouta: f_p.position_future_qouta,
                                                    position_valid_from: f_p.position_ft_valid_from,
                                                    position_valid_to: f_p.position_ft_valid_to,
                                                    position_check: f_p.position_ft_check,
                                                }
                                                Position.findByIdAndUpdate(ps._id, ob, next)
                                            } else {
                                                next(null, null)
                                            }

                                        } else {
                                            next(null, null)
                                        }
                                    })

                                }, cb)
                            } else {
                                cb(null, null)
                            }
                        })
                    },

                }, function(err, data) {
                    var c = _.filter(data.companys, function(c) {
                        return c != null
                    })
                    var o = _.filter(data.ous, function(o) {
                        return o != null
                    })
                    var p = _.filter(data.positions, function(p) {
                        return p != null
                    })
                    if (err) {
                        next(err, null);
                    };
                    next(null, sprintf("客户 %s %s 处理 %s 条公司数据,%s 条部门数据,%s 条职位数据", colors.green(clients[n].client), colors.yellow('<' + clients[n].name + '>'), colors.green(c.length), colors.green(o.length), colors.green(p.length)));
                })

            }, cb)
        }
    ], function(err, ret) {
        cb(err, ret);
        console.timeEnd(job_label);
    });
}
var update_real_emp = function(cb) {
    var c_date = moment().format('YYYY-MM-DD');
    var job_label = colors.blueBG(colors.bold('运行时长 update_real_emp'))
    console.time(job_label);
    async.waterfall([

        function(cb) {
            Client.find({
                block: false //只处理正常状态的client
            }).sort({
                client: 1
            }).exec(cb);
        },
        function(clients, cb) {
            async.times(clients.length, function(n, next) {

                async.waterfall([

                    function(cb) {
                        async.parallel({
                            peoples: function(cb) {
                                People.find({
                                    client: clients[n]._id,
                                }).exec(cb);
                            },
                            positions: function(cb) {
                                Position.find({
                                    client: clients[n]._id
                                }).populate('jobrank career').exec(cb)
                            }
                        }, cb)

                    },
                    function(objs, cb) {
                        var peopels = objs.peoples;
                        var positions = objs.positions;
                        async.times(positions.length, function(n, next) {
                            position = positions[n];
                            var f_ps = _.filter(peopels, function(p) {
                                return String(p.position) == position.id
                            })
                            position.position_real_qouta = f_ps.length;
                            position.save(next);
                        }, cb)
                    }
                ], function(err, data) {
                    if (err) {
                        next(err, null);
                    };
                    next(null, sprintf("客户 %s %s 处理 %s 条数据", colors.green(clients[n].client), colors.yellow('<' + clients[n].name + '>'), colors.green(data.length)));
                });

            }, cb)
        }
    ], function(err, ret) {
        cb(err, ret);
        console.timeEnd(job_label);
    });
}
module.exports.copy_pa_report_05to10 = copy_pa_report_05to10;
module.exports.copy_pa_report_002 = copy_pa_report_002;
module.exports.pa_report_002 = pa_report_002;
module.exports.pa_report_005 = pa_report_005;
module.exports.pa_report_006 = pa_report_006;
module.exports.pa_report_007 = pa_report_007;
module.exports.pa_report_008 = pa_report_008;
module.exports.pa_report_009 = pa_report_009;
module.exports.pa_report_010 = pa_report_010;
module.exports.pa_report_002_sub_total = pa_report_002_sub_total;
module.exports.pa_report_subordinates_total = pa_report_subordinates_total;
module.exports.prepare_report = prepare_report;
module.exports.update_real_emp = update_real_emp;
