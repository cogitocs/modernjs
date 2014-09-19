var moment = require('moment');
var sprintf = require('sprintf').sprintf;
var util = require('util');
var _ = require('underscore');
var async = require('async');
var Position = require('../../models/position').Position;
var People = require('../../models/people').People;
var Company = require('../../models/structure').Company;
var AssessmentInstance = require('../../models/pm').AssessmentInstance;
var PersonnelRange = require('../../models/structure').PersonnelRange;
var PersonnelSubRange = require('../../models/structure').PersonnelSubRange;
var PointsSystemClient = require('../../models/pm').PointsSystemClient;
var OrganizationUnit = require('../../models/organization').OrganizationUnit;
var PeriodManagement = require('../../models/pm').PeriodManagement;
var Questionnair360AndCAInstance = require('../../models/pm').Questionnair360AndCAInstance;
var HoroScope = require('../../models/pm').HoroScope;
var PayrollPeopleInstance = require('../../models/payroll').PayrollPeopleInstance;
var PayrollItemClient = require('../../models/payroll').PayrollItemClient;

var TalentLambda = require('../../models/pm').TalentLambda;

var ObjectivePlan = require('../../models/pm').ObjectivePlan;
var JobLevel = require('../../models/position').JobLevel;
var JobRank = require('../../models/position').JobRank;
var TalentPool = require('../../models/pm').TalentPool;
var TalentType = require('../../models/pm').TalentType;
var IM = require('../../models/im').IM;
var excel_maker = require('excel-export');
var nums = ['9', '10', '11', '12', '13'];
var emp_performance = function(req, res) {
	var i18n = req.i18n;
	var client = req.user.client.id;
	var render_data = {
		title: '报表－员工绩效汇总',
		user: req.user,
		_: _,
		moment: moment
	};
	async.parallel({
		companies: function(cb) {
			Company.find({
				_id: {
					$in: req.user.companies
				}
			}, cb);
		},
		personnelranges: function(cb) {
			PersonnelRange.find({
				client: client,
				activate: true,
				block: false,
			}).sort({
				'pr_code': 1
			}).exec(cb);
		},
		personnelsubranges: function(cb) {
			PersonnelSubRange.find({
				client: client,
				activate: true,
				block: false,
			}, cb)
		}
	}, function(err, result) {
		if (err) {
			req.app.locals.handle500(err, req, res);
		};
		render_data.companies = result.companies;
		render_data.personnelranges = result.personnelranges;
		render_data.personnelsubranges = result.personnelsubranges;
		res.render('user/user_report/rp_emp', render_data);
	})
}
var emp_performance_json = function(req, res) {
	var i18n = req.i18n;
	var client = req.user.client.id;
	var user = req.user;
	var sEcho = req.body.sEcho ? req.body.sEcho : 1;
	//从第几行开始查
	var iDisplayStart = req.body.iDisplayStart ? req.body.iDisplayStart : 0;
	//每页显示的长度
	var iDisplayLength = req.body.iDisplayLength ? req.body.iDisplayLength : 10;
	var sSearch = req.body.sSearch || ''; //搜索框输入的值
	//查询条件
	var cond = {
		client: client,
		ai_status: {
			$in: nums
		},
	};
	if (req.body.peoples) {
		cond.people = {
			$in: JSON.parse(req.body.peoples)
		}
	};

	if (req.body.year && req.body.year_t) {
		var year = parseInt(req.body.year);
		var year_t = parseInt(req.body.year_t);
		var years = _.range(year, year_t + 1);
		years = _.map(years, function(y) {
			return String(y)
		})
		if (years.length > 0) {
			cond.year = {
				$in: years
			}
		};
	};
	var company = req.body.company; //查询当年的
	var personnelrange = req.body.personnelrange;
	var personnelsubrange = req.body.personnelsubrange;
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
				joblevel_name: re
			}, {
				ou_name: re
			}, {
				ai_grade: re
			}, {
				ai_forced_distribution_grade: re
			}

		];
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
	async.series({
		companys: function(cb) {
			PersonnelRange.findById(personnelrange, function(err, personnelrange) {
				var items = [];
				if (company && personnelrange) {
					var f_c = us.find(personnelrange.compaines, function(c) {
						return String(c) == String(company)
					})
					if (f_c) {
						items.push(company)
					};
					cond.company = {
						$in: items
					}
				} else if (company || personnelrange) {
					if (company) {
						items.push(company)
					};
					if (personnelrange) {
						items = personnelrange.compaines
					};
					cond.company = {
						$in: items
					}
				}

				cb(null, null)

			});
		},
		ous: function(cb) {
			PersonnelSubRange.findById(personnelsubrange, function(err, per) {
				if (per) {
					cond.ou = {
						$in: per.ous
					}
					cb(null, per.ous)
				} else {
					cb(null, null)
				}
			})
		},
		total: function(cb) {
			AssessmentInstance.count(cond, cb);
		},
		ats_sort: function(cb) {
			AssessmentInstance.find({
				client: client,
				ai_status: {
					$in: nums
				}
			}).populate({
				path: 'people',
				select: '_id ou people_name ou_name people_no employee_status company_name'
			}).exec(function(err, result) {
				var ai_group = _.groupBy(result, function(temp) {
					return temp.period
				})
				var ai_key = _.keys(ai_group);
				async.times(ai_key.length, function(n, next) {
					var key_ai = ai_key[n];
					var ou_pep = _.groupBy(ai_group[key_ai], function(temp) {
						return temp.people.ou
					})
					var ou_key = _.keys(ou_pep);
					var ou_pep_num = {}, people_sort = {};
					_.each(ou_key, function(key) {
						var ou_value = ou_pep[key] ? ou_pep[key] : '';
						ou_pep_num[key] = !! ou_value ? ou_value.length : 0;
						var sort_data_asc = _.sortBy(ou_value, function(value) {
							return value.ai_score
						})
						sort_data_asc.reverse();
						for (var i = 0; i < sort_data_asc.length; i += 1) {
							people_sort[sort_data_asc[i]._id] = i + 1;
						}
					})
					if (ai_group[key_ai]) {
						async.times(ai_group[key_ai].length, function(n, next) {
							var res = ai_group[key_ai][n];
							res.performance_rank = people_sort[res.id] + '/' + ou_pep_num[res.ou];
							res.save(next)
						}, next)
					}

				}, cb)

			})
		},
		ats: function(cb) {
			AssessmentInstance.find(cond)
				.populate({
					path: 'people',
					select: '_id people_name ou_name people_no employee_status company_name'
				})
				.sort(sort_cond).skip(iDisplayStart).limit(iDisplayLength).exec(cb);
		},
	}, function(err, result) {
		if (err) {
			return res.json({
				code: 'ERR',
				msg: '内部服务器错误：' + err
			});
		} else {
			var tblData = [];
			var people_status_class = {
				'P': 'text-info',
				'H': 'text-success',
				'L': 'text-warning',
				'R': 'employee_status'
			};
			var people_status_title = {
				'P': '试用期',
				'H': '正式雇佣',
				'L': '停薪留职',
				'R': '已离职'
			};
			// var ou_pep_num = result.ats_sort.ou_pep_num;
			// var people_sort = result.ats_sort.people_sort;
			_.each(result.ats, function(x) {
				var row = [];
				row.push(x.people.people_no); //col  1
				row.push(x.people.people_name); //col 2
				var status_icon = '<i class="icon-fixed-width icon-user ' + people_status_class[x.people.employee_status] + '" data-title="' + people_status_title[x.people.employee_status] + '"></i>';
				row.push(status_icon);
				row.push(x.people.company_name);
				row.push(x.position_name);
				row.push(x.people.ou_name)
				row.push(x.joblevel_name)
				row.push(x.period_name)
				row.push(changeTwoDecimal(x.ai_score) || 0);
				row.push(x.ai_grade || '');
				row.push(x.ai_forced_distribution_grade || '');
				row.push(x.performance_rank)
				var btns = [];
				btns.push('<div class="btn-group">');
				btns.push(sprintf('<a href="/admin/pm/assessment_instance/edit/%s?mode=view" target="_blank" class="btn btn-small" ><i class="icon-file-text-alt" data-title="绩效合同"></i></a>', x._id));
				btns.push(sprintf('<a href="/admin/pm/assessment_instance/wip/bbform?ai_id=%s" target="_blank" class="btn btn-small" ><i class="icon-random" data-title="绩效过程"></i></a>', x._id));
				btns.push(sprintf('<a href="/admin/pm/assessment_instance/summary/bbform?ai_id=%s" target="_blank" class="btn btn-small" ><i class="icon-eye-open" data-title="绩效总结"></i></a>', x._id));
				btns.push(sprintf('<a href="/admin/pm/assessment_instance/review/bbform?ai_id=%s" class="btn btn-small" target="_blank"><i class="icon-smile"  data-title="绩效面谈"></i></a>', x._id));
				btns.push('</div>');
				row.push(btns.join(''));
				tblData.push(row);
			});

			return res.json({
				code: 'OK',
				sEcho: sEcho,
				iTotalRecords: result.total,
				iTotalDisplayRecords: result.total,
				aaData: tblData,
			});
		};
	})
}

	function changeTwoDecimal(x) {
		var f_x = parseFloat(x);
		if (isNaN(f_x)) {
			return false;
		}
		var f_x = Math.round(x * 100) / 100;
		var s_x = f_x.toString();
		var pos_decimal = s_x.indexOf('.');
		if (pos_decimal < 0) {
			pos_decimal = s_x.length;
			s_x += '.';
		}
		while (s_x.length <= pos_decimal + 2) {
			s_x += '0';
		}
		return s_x;
	}
var emp_performance_graph = function(req, res) {
	var i18n = req.i18n;
	var client = req.user.client.id;
	var render_data = {
		title: '报表－员工绩效汇总',
		user: req.user,
		_: _,
	};
	async.parallel({
		companies: function(cb) {
			Company.find({
				_id: {
					$in: req.user.companies
				}
			}, cb);
		},
		personnelranges: function(cb) {
			PersonnelRange.find({
				client: client,
				activate: true,
				block: false,
			}).sort({
				'pr_code': 1
			}).exec(cb);
		},

	}, function(err, result) {
		if (err) {
			req.app.locals.handle500(err, req, res);
		};
		render_data.companies = result.companies;
		render_data.personnelranges = result.personnelranges;
		res.render('user/user_report/rp_emp_graph', render_data);
	})
}
var emp_performance_graph_json = function(req, res) {
	var client = req.user.client.id;
	var cond = {
		client: client,
		ai_status: {
			$in: nums
		},
	};
	cond.year = req.body.year || moment().format('YYYY'); //查询当年的
	// var company = req.body.company; //查询当年的
	// var personnelrange = req.body.personnelrange;
	// var personnelsubrange = req.body.personnelsubrange;
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
	if (cond_pm.length) {
		cond["$and"] = [];
		if (cond_pm.length) {
			cond["$and"].push({
				$or: cond_pm
			})
		};
	};
	async.series({
		companys: function(cb) {
			Company.find({
				client: client
			}, function(err, compans) {
				var ids = [];
				var ids_name = [];
				_.each(compans, function(c) {
					ids.push(c._id);
					ids_name.push(c.company_name);
				})
				cb(null, _.object(ids, ids_name))
			})
		},
		ous: function(cb) {
			OrganizationUnit.find({
				client: client
			}, function(err, ous) {
				var ids = [];
				var ids_name = [];
				_.each(ous, function(c) {
					ids.push(c._id);
					ids_name.push(c.ou_name);
				})
				cb(null, _.object(ids, ids_name))
			})
		},
		grade: function(cb) {
			PointsSystemClient.findOne({
				client: client,
				is_base: true
			}, cb)
		},
		ais: function(cb) {
			AssessmentInstance.find(cond)
				.populate({
					path: 'people',
					select: '_id people_name ou_name people_no employee_status company_name'
				}).exec(cb);
		},
	}, function(err, result) {
		var items = [];
		if (result.grade) {
			var grades = _.sortBy(result.grade.grades, function(g) {
				return Math.min(g.grade_high_value);
			})
			_.each(grades, function(g) {
				items.push(g.grade_name)
			})
		};
		res.json({
			code: 'OK',
			grades: items.reverse(),
			result: result.ais,
			companys: result.companys,
			ous: result.ous
		})
	})
}
var emp_performance_tendency = function(req, res) {
	var i18n = req.i18n;
	var client = req.user.client.id;
	var render_data = {
		title: '报表－绩效等级趋势',
		user: req.user,
		_: _,
	};
	res.render('user/user_report/rp_emp_tendency', render_data);
}
var emp_performance_tendency_json = function(req, res) {
	var client = req.user.client.id;
	var period_type = req.body.period_type;
	var year = req.body.year;

	var cond = {
		client: client,
		year: year,
		ai_status: {
			$in: nums
		},
		period_type: period_type,
	};

	var companys = []
	if (req.body.companys) {
		companys = JSON.parse(req.body.companys);
	};
	if (companys.length > 0) {
		cond.company = {
			$in: companys
		}
	};
	var joblevel_names = []
	if (req.body.joblevel_names) {
		joblevel_names = JSON.parse(req.body.joblevel_names);
	};
	if (joblevel_names.length > 0) {
		cond.joblevel_name = {
			$in: joblevel_names
		}
	};
	var ous = []
	if (req.body.ous) {
		ous = JSON.parse(req.body.ous);
	};
	if (ous.length > 0) {
		cond.ou = {
			$in: ous
		}
	};
	async.parallel({
		grade: function(cb) {
			PointsSystemClient.findOne({
				client: client,
				is_base: true
			}, cb)
		},
		ais: function(cb) {
			AssessmentInstance.find(cond)
				.populate({
					path: 'people',
					select: '_id people_name ou_name people_no employee_status company_name'
				}).exec(cb);
		},
	}, function(err, result) {
		var items = [];
		if (result.grade) {
			var grades = _.sortBy(result.grade.grades, function(g) {
				return Math.min(g.grade_high_value);
			})
			_.each(grades, function(g) {
				items.push(g.grade_name)
			})
		}
		res.json({
			code: 'OK',
			grades: items.reverse(),
			result: result.ais,
		})
	})
}

var emp_performance_tendency_ct = function(req, res) {
	var i18n = req.i18n;
	var client = req.user.client.id;
	var render_data = {
		title: '报表－绩效等级对比',
		user: req.user,
		_: _,
	};
	res.render('user/user_report/rp_emp_tendency_ct', render_data);
}
var emp_performance_tendency_ct_json = function(req, res) {

	var client = req.user.client.id;
	var period_type = req.body.period_type;
	var period_value = req.body.period_value;
	var year = req.body.year;

	var cond = {
		client: client,
		year: year,
		ai_status: {
			$in: nums
		},
		period_type: period_type,
		period_value: parseInt(period_value) - 1
	};

	var companys = []
	if (req.body.companys) {
		companys = JSON.parse(req.body.companys);
	};
	if (companys.length > 0) {
		cond.company = {
			$in: companys
		}
	};
	var joblevel_names = []
	if (req.body.joblevel_names) {
		joblevel_names = JSON.parse(req.body.joblevel_names);
	};
	if (joblevel_names.length > 0) {
		cond.joblevel_name = {
			$in: joblevel_names
		}
	};
	var ous = []
	if (req.body.ous) {
		ous = JSON.parse(req.body.ous);
	};
	if (ous.length > 0) {
		cond.ou = {
			$in: ous
		}
	};
	async.parallel({
		grade: function(cb) {
			PointsSystemClient.findOne({
				client: client,
				is_base: true
			}, cb)
		},
		ais: function(cb) {
			AssessmentInstance.find(cond)
				.populate({
					path: 'people',
					select: '_id people_name ou_name people_no employee_status company_name'
				}).exec(cb);
		},
	}, function(err, result) {
		var items = [];
		if (result.grade) {
			var grades = _.sortBy(result.grade.grades, function(g) {
				return Math.min(g.grade_high_value);
			})
			_.each(grades, function(g) {
				items.push(g.grade_name)
			})
		}
		res.json({
			code: 'OK',
			grades: items.reverse(),
			result: result.ais,
		})
	})
}


var emp_performance_score_tendency = function(req, res) {
	var i18n = req.i18n;
	var client = req.user.client.id;
	var render_data = {
		title: '报表－绩效得分趋势',
		user: req.user,
		_: _,
	};
	res.render('user/user_report/rp_emp_score_tendency', render_data);
}
var emp_performance_score_tendency_json = function(req, res) {
	var client = req.user.client.id;
	var period_type = req.body.period_type;
	var year = req.body.year;
	var year_t = req.body.year_t;
	var months = req.body.months;
	var months_t = req.body.months_t;
	var cond = {
		client: client,
		year: year,
		ai_status: {
			$in: nums
		},
		period_type: period_type,
	};
	var range_years = _.range(parseInt(year), parseInt(year_t) + 1);
	var years = []
	_.each(range_years, function(r) {
		years.push(String(r))
	})
	if (years.length > 0) {
		cond.year = {
			$in: years
		};
	};
	var companys = []
	if (req.body.companys) {
		companys = JSON.parse(req.body.companys);
	};
	if (companys.length > 0) {
		cond.company = {
			$in: companys
		}
	};
	var joblevel_names = []
	if (req.body.joblevel_names) {
		joblevel_names = JSON.parse(req.body.joblevel_names);
	};
	if (joblevel_names.length > 0) {
		cond.joblevel_name = {
			$in: joblevel_names
		}
	};
	var ous = []
	if (req.body.ous) {
		ous = JSON.parse(req.body.ous);
	};
	if (ous.length > 0) {
		cond.ou = {
			$in: ous
		}
	};
	async.parallel({
		companys: function(cb) {
			Company.find({
				client: client
			}, function(err, compans) {
				var ids = [];
				var ids_name = [];
				_.each(compans, function(c) {
					ids.push(c._id);
					ids_name.push(c.company_name);
				})
				cb(null, _.object(ids, ids_name))
			})
		},
		ous: function(cb) {
			OrganizationUnit.find({
				client: client
			}, function(err, ous) {
				var ids = [];
				var ids_name = [];
				_.each(ous, function(c) {
					ids.push(c._id);
					ids_name.push(c.ou_name);
				})
				cb(null, _.object(ids, ids_name))
			})
		},
		grade: function(cb) {
			PointsSystemClient.findOne({
				client: client,
				is_base: true
			}, cb)
		},
		ais: function(cb) {
			AssessmentInstance.find(cond)
				.populate({
					path: 'people',
					select: '_id people_name ou_name people_no employee_status company_name'
				}).sort({
					'period_value': 1
				}).exec(cb);
		},
	}, function(err, result) {
		var items = [];
		if (result.grade) {
			var grades = _.sortBy(result.grade.grades, function(g) {
				return Math.min(g.grade_high_value);
			})
			_.each(grades, function(g) {
				items.push(g.grade_name)
			})
		}
		res.json({
			code: 'OK',
			grades: items.reverse(),
			result: result.ais,
			companys: result.companys,
			ous: result.ous
		})
	})
}

var emp_performance_score_histogram = function(req, res) {
	var i18n = req.i18n;
	var client = req.user.client.id;
	var render_data = {
		title: '报表－员工绩效得分',
		user: req.user,
		_: _,
	};
	res.render('user/user_report/rp_emp_score_histogram', render_data);
}
var emp_performance_score_histogram_json = function(req, res) {

	var client = req.user.client.id;
	var period_type = req.body.period_type;
	var period_value = req.body.period_value;
	var cond = {
		client: client,
		ai_status: {
			$in: nums
		},
		period_type: period_type,
		period_value: parseInt(period_value) - 1
	};

	cond.year = req.body.year || moment().format('YYYY'); //查询当年的
	// if (req.body.period_type) {
	// 	cond.period_type = req.body.period_type
	// };
	// if (req.body.period_value) {
	// 	cond.period_value = req.body.period_value
	// };
	var c_p = _.clone(cond);
	if (req.body.emps) {
		var emps = JSON.parse(req.body.emps);
		cond.people = {
			$in: emps
		};
	};
	if (req.body.ous) {
		cond.ou = {
			$in: JSON.parse(req.body.ous)
		};
	};
	if (req.body.joblevels) {
		cond.joblevel_name = {
			$in: JSON.parse(req.body.joblevels)
		};
	};
	var p_w = [{
		path: 'people',
		select: '_id people_name position jobrank ou_name people_no employee_status company_name'
	}, {
		path: 'qualitative_pis.items.pi',
		select: '_id pi_name'
	}, {
		path: 'quantitative_pis.items.pi',
		select: '_id pi_name'
	}]
	async.parallel({
		ais: function(cb) {
			AssessmentInstance.find(cond)
				.populate(p_w).exec(cb);
		},
		o_plans: function(cb) {
			c_p = _.omit(c_p, 'ai_status');
			c_p.op_status = '6'
			ObjectivePlan.find(c_p).exec(cb)
		}
	}, function(err, result) {
		res.json({
			code: 'OK',
			result: result.ais,
			o_plans: result.o_plans
		})
	})

}
var emps_performance_score_histogram = function(req, res) {
	var i18n = req.i18n;
	var client = req.user.client.id;
	var render_data = {
		title: '报表－多员工绩效得分',
		user: req.user,
		_: _,
	};
	res.render('user/user_report/rp_emps_score_histogram', render_data);

}
var emps_performance_score_histogram_json = function(req, res) {
	var client = req.user.client.id;
	var year = req.body.year;
	var year_t = req.body.year_t;
	var cond = {
		client: client,
		year: year,
		ai_status: {
			$in: nums
		},
		period_type: req.body.period_type,
	};
	var range_years = _.range(parseInt(year), parseInt(year_t) + 1);
	var years = []
	_.each(range_years, function(r) {
		years.push(String(r))
	})
	if (years.length > 0) {
		cond.year = {
			$in: years
		};
	};

	if (req.body.emps) {
		var emps = JSON.parse(req.body.emps);
		cond.people = {
			$in: emps
		};
	};
	if (req.body.ous) {
		cond.ou = {
			$in: JSON.parse(req.body.ous)
		};
	};
	if (req.body.joblevels) {
		cond.joblevel_name = {
			$in: JSON.parse(req.body.joblevels)
		};
	};
	AssessmentInstance.find(cond)
		.populate({
			path: 'people',
			select: '_id people_name jobrank position ou_name people_no employee_status company_name'
		}).exec(function(err, ais) {
			res.json({
				code: 'OK',
				result: ais,
			})
		});
}
var emp_performance_index_histogram = function(req, res) {
	var i18n = req.i18n;
	var client = req.user.client.id;
	var render_data = {
		title: '报表－员工指标得分',
		user: req.user,
		_: _,
	};
	res.render('user/user_report/rp_emp_index_histogram', render_data);
}
var emp_performance_index_histogram_json = function(req, res) {
	var client = req.user.client.id;
	var period_type = req.body.period_type;
	var period_value = req.body.period_value;
	var cond = {
		client: client,
		ai_status: {
			$in: nums
		},
		period_type: period_type,
		period_value: parseInt(period_value) - 1
	};
	if (req.body.emps) {
		cond.people = {
			$in: JSON.parse(req.body.emps)
		};
	};
	if (req.body.ous) {
		cond.ou = {
			$in: JSON.parse(req.body.ous)
		};
	};
	if (req.body.joblevels) {
		cond.joblevel_name = {
			$in: JSON.parse(req.body.joblevels)
		};
	};
	cond.year = req.body.year || moment().format('YYYY'); //查询当年的
	// if (req.body.period_type) {
	// 	cond.period_type = req.body.period_type
	// };
	// if (req.body.period_value) {
	// 	cond.period_value = parseInt(req.body.period_value)
	// };
	var p_w = [{
		path: 'people',
		select: '_id people_name position jobrank ou_name people_no employee_status company_name'
	}, {
		path: 'qualitative_pis.items.pi',
		select: '_id pi_name'
	}, {
		path: 'qualitative_pis.items.ol',
		select: '_id ol_name'
	}, {
		path: 'quantitative_pis.items.pi',
		select: '_id pi_name'
	}, {
		path: 'quantitative_pis.items.ol',
		select: '_id ol_name'
	}]
	AssessmentInstance.find(cond)
		.populate(p_w).exec(function(err, ais) {
			res.json({
				code: 'OK',
				result: ais,
			})
		});
}
var emps_performance_index_histogram = function(req, res) {
	var i18n = req.i18n;
	var client = req.user.client.id;
	var render_data = {
		title: '报表－员工指标得分',
		user: req.user,
		_: _,
	};
	res.render('user/user_report/rp_emps_index_histogram', render_data);
}
var emps_performance_index_histogram_json = function(req, res) {

	var client = req.user.client.id;
	var year = req.body.year;
	var year_t = req.body.year_t;
	var cond = {
		client: client,
		year: year,
		ai_status: {
			$in: nums
		},
		period_type: req.body.period_type,
	};
	var range_years = _.range(parseInt(year), parseInt(year_t) + 1);
	var years = []
	_.each(range_years, function(r) {
		years.push(String(r))
	})
	if (years.length > 0) {
		cond.year = {
			$in: years
		};
	};

	if (req.body.emps) {
		var emps = JSON.parse(req.body.emps);
		cond.people = {
			$in: emps
		};
	};
	if (req.body.ous) {
		cond.ou = {
			$in: JSON.parse(req.body.ous)
		};
	};
	if (req.body.joblevels) {
		cond.joblevel_name = {
			$in: JSON.parse(req.body.joblevels)
		};
	};
	var p_w = [{
		path: 'people',
		select: '_id people_name position jobrank ou_name people_no employee_status company_name'
	}, {
		path: 'qualitative_pis.items.pi',
		select: '_id pi_name'
	}, {
		path: 'qualitative_pis.items.ol',
		select: '_id ol_name'
	}, {
		path: 'quantitative_pis.items.pi',
		select: '_id pi_name'
	}, {
		path: 'quantitative_pis.items.ol',
		select: '_id ol_name'
	}]
	AssessmentInstance.find(cond)
		.populate(p_w).exec(function(err, ais) {
			res.json({
				code: 'OK',
				result: ais,
			})
		});
}
var input_help_emps = function(req, res) {
	var client = req.user.client.id;
	async.parallel({
		joblevels: function(cb) { //层级
			JobLevel.find({
				client: client,
				block: false,
				activate: true
			}, cb)
		},
		jobranks: function(cb) { //职级
			JobRank.find({
				client: client,
				block: false,
				activate: true
			}, cb)
		}
	}, function(err, result) {
		if (err) {
			res.json({
				code: 'ERR',
				msg: '内部服务器错误：' + err
			});
		};
		res.render('user/user_report/input_help_emps', {
			jobranks: result.jobranks,
			joblevels: result.joblevels,
		});
	})

}
var emp_performance_score_bubble = function(req, res) {
	var i18n = req.i18n;
	var client = req.user.client.id;
	var render_data = {
		title: '报表－员工绩效得分',
		user: req.user,
		_: _,
		moment: moment
	};
	res.render('user/user_report/rp_emp_score_bubble', render_data);
}
var emp_performance_score_bubble_json = function(req, res) {
	var client = req.user.client.id;
	var period_type = req.body.period_type;
	var year = req.body.year;

	var cond = {
		client: client,
		year: year,
		ai_status: {
			$in: nums
		},
		period_type: period_type,
	};

	var companys = []
	if (req.body.companys) {
		companys = JSON.parse(req.body.companys);
	};
	if (companys.length > 0) {
		cond.company = {
			$in: companys
		}
	};
	var joblevel_names = []
	if (req.body.joblevel_names) {
		joblevel_names = JSON.parse(req.body.joblevel_names);
	};
	if (joblevel_names.length > 0) {
		cond.joblevel_name = {
			$in: joblevel_names
		}
	};
	var ous = []
	if (req.body.ous) {
		ous = JSON.parse(req.body.ous);
	};
	if (ous.length > 0) {
		cond.ou = {
			$in: ous
		}
	};
	async.parallel({
		grade: function(cb) {
			PointsSystemClient.findOne({
				client: client,
				is_base: true
			}, cb)
		},
		ais: function(cb) {
			AssessmentInstance.find(cond)
				.populate({
					path: 'people',
					select: '_id people_name ou_name people_no employee_status company_name'
				}).exec(cb);
		},
	}, function(err, result) {
		var items = [];
		if (result.grade) {
			var grades = _.sortBy(result.grade.grades, function(g) {
				return Math.min(g.grade_high_value);
			})
			_.each(grades, function(g) {
				items.push(g.grade_name)
			})
		}
		res.json({
			code: 'OK',
			grades: items.reverse(),
			result: result.ais,
		})
	})
}
var emp_performance_score_scatter = function(req, res) {
	var i18n = req.i18n;
	var client = req.user.client.id;
	var render_data = {
		title: '报表－员工绩效得分',
		user: req.user,
		_: _,
	};
	res.render('user/user_report/rp_emp_score_scatter', render_data);
}
var emp_performance_score_scatter_json = function(req, res) {

	var client = req.user.client.id;
	var period_type = req.body.period_type;
	var year = req.body.year;
	var period_value = req.body.period_value;

	var cond = {
		client: client,
		year: year,
		ai_status: {
			$in: nums
		},
		period_type: period_type,
		period_value: parseInt(period_value) - 1
	};

	var companys = []
	if (req.body.companys) {
		companys = JSON.parse(req.body.companys);
	};
	if (companys.length > 0) {
		cond.company = {
			$in: companys
		}
	};
	var joblevel_names = []
	if (req.body.joblevel_names) {
		joblevel_names = JSON.parse(req.body.joblevel_names);
	};
	if (joblevel_names.length > 0) {
		cond.joblevel_name = {
			$in: joblevel_names
		}
	};
	var ous = []
	if (req.body.ous) {
		ous = JSON.parse(req.body.ous);
	};
	if (ous.length > 0) {
		cond.ou = {
			$in: ous
		}
	};
	async.parallel({
		jobranks: function(cb) {
			JobRank.find({
				client: client
			}).sort({
				'jobrank_name': 1
			}).exec(cb)
		},
		grade: function(cb) {
			PointsSystemClient.findOne({
				client: client,
				is_base: true
			}, cb)
		},
		ais: function(cb) {
			AssessmentInstance.find(cond)
				.populate({
					path: 'people',
					select: '_id avatar subordinates jobrank people_name tel cell email company_name position_name ou_name people_no employee_status company_name'
				}).exec(cb);
		},
	}, function(err, result) {
		var items = [];
		if (result.grade) {
			var grades = _.sortBy(result.grade.grades, function(g) {
				return Math.min(g.grade_high_value);
			})
			_.each(grades, function(g) {
				items.push(g.grade_name)
			})
		}
		res.json({
			code: 'OK',
			grades: items.reverse(),
			jobranks: result.jobranks,
			result: result.ais,
		})
	})
}
var emps_performance_index_accounting = function(req, res) {
	var i18n = req.i18n;
	var client = req.user.client.id;
	var render_data = {
		title: '报表－指标占比趋势',
		user: req.user,
		_: _,
	};
	res.render('user/user_report/rp_emps_index_accounting', render_data);
}
var emps_performance_index_accounting_json = function(req, res) {


	var client = req.user.client.id;
	var year = req.body.year;
	var year_t = req.body.year_t;
	var cond = {
		client: client,
		year: year,
		ai_status: {
			$in: nums
		},
		period_type: req.body.period_type,
	};
	var range_years = _.range(parseInt(year), parseInt(year_t) + 1);
	var years = []
	_.each(range_years, function(r) {
		years.push(String(r))
	})
	if (years.length > 0) {
		cond.year = {
			$in: years
		};
	};
	var companys = [];
	if (req.body.companys) {
		companys = JSON.parse(req.body.companys);
	};
	if (companys.length > 0) {
		cond.company = {
			$in: companys
		}
	};
	if (req.body.emps) {
		var emps = JSON.parse(req.body.emps);
		cond.people = {
			$in: emps
		};
	};
	if (req.body.ous) {
		cond.ou = {
			$in: JSON.parse(req.body.ous)
		};
	};
	if (req.body.joblevels) {
		cond.joblevel_name = {
			$in: JSON.parse(req.body.joblevels)
		};
	};
	AssessmentInstance.find(cond)
		.populate({
			path: 'people',
			select: '_id people_name position jobrank ou_name people_no employee_status company_name'
		}).exec(function(err, ais) {
			res.json({
				code: 'OK',
				result: ais,
			})
		});
}
var emp_performance_index_contrast = function(req, res) {
	var i18n = req.i18n;
	var client = req.user.client.id;
	var render_data = {
		title: '报表－指标占比对比',
		user: req.user,
		_: _,
	};
	res.render('user/user_report/rp_emp_index_contrast', render_data);
}
var emp_performance_index_contrast_json = function(req, res) {
	var client = req.user.client.id;
	var period_type = req.body.period_type;
	var year = req.body.year;
	var period_value = req.body.period_value;

	var cond = {
		client: client,
		year: year,
		ai_status: {
			$in: nums
		},
		period_type: period_type,
		period_value: parseInt(period_value) - 1
	};

	var companys = []
	if (req.body.companys) {
		companys = JSON.parse(req.body.companys);
	};
	if (companys.length > 0) {
		cond.company = {
			$in: companys
		}
	};
	var joblevel_names = []
	if (req.body.joblevel_names) {
		joblevel_names = JSON.parse(req.body.joblevel_names);
	};
	if (joblevel_names.length > 0) {
		cond.joblevel_name = {
			$in: joblevel_names
		}
	};
	var jobrank_names = []
	if (req.body.jobrank_names) {
		jobrank_names = JSON.parse(req.body.jobrank_names);
	};
	if (jobrank_names.length > 0) {
		cond.jobrank_name = {
			$in: jobrank_names
		}
	};
	var ous = []
	if (req.body.ous) {
		ous = JSON.parse(req.body.ous);
	};
	if (ous.length > 0) {
		cond.ou = {
			$in: ous
		}
	};

	AssessmentInstance.find(cond)
		.populate({
			path: 'people',
			select: '_id avatar subordinates jobrank people_name tel cell email company_name position_name ou_name people_no employee_status company_name'
		}).exec(function(err, ais) {
			res.json({
				code: 'OK',
				result: ais,
			})

		})
}
var emps_performance_index_boxplot = function(req, res) {
	var i18n = req.i18n;
	var client = req.user.client.id;
	var render_data = {
		title: '报表－指标趋势箱线图',
		user: req.user,
		_: _,
	};
	res.render('user/user_report/rp_emps_index_boxplot', render_data);
}
var emps_performance_index_boxplot_json = function(req, res) {
	var client = req.user.client.id;
	var year = req.body.year;
	var year_t = req.body.year_t;
	var cond = {
		client: client,
		year: year,
		ai_status: {
			$in: nums
		},
		period_type: req.body.period_type,
	};
	var range_years = _.range(parseInt(year), parseInt(year_t) + 1);
	var years = []
	_.each(range_years, function(r) {
		years.push(String(r))
	})
	if (years.length > 0) {
		cond.year = {
			$in: years
		};
	};
	var companys = [];
	if (req.body.companys) {
		companys = JSON.parse(req.body.companys);
	};
	if (companys.length > 0) {
		cond.company = {
			$in: companys
		}
	};
	if (req.body.emps) {
		var emps = JSON.parse(req.body.emps);
		cond.people = {
			$in: emps
		};
	};
	if (req.body.ous) {
		cond.ou = {
			$in: JSON.parse(req.body.ous)
		};
	};
	if (req.body.joblevels) {
		cond.joblevel_name = {
			$in: JSON.parse(req.body.joblevels)
		};
	};
	var p_w = [{
		path: 'people',
		select: '_id people_name position jobrank ou_name people_no employee_status company_name'
	}, {
		path: 'qualitative_pis.items.pi',
		select: '_id pi_name'
	}, {
		path: 'quantitative_pis.items.pi',
		select: '_id pi_name'
	}]
	AssessmentInstance.find(cond)
		.populate(p_w).exec(function(err, ais) {
			res.json({
				code: 'OK',
				result: ais,
			})
		});
}
var emp_performance_index_boxplot = function(req, res) {
	var i18n = req.i18n;
	var client = req.user.client.id;
	var render_data = {
		title: '报表－指标对比箱线图',
		user: req.user,
		_: _,
		moment: moment,

	};
	res.render('user/user_report/rp_emp_index_boxplot', render_data);
}
var emp_performance_index_boxplot_json = function(req, res) {

	var client = req.user.client.id;
	var period_type = req.body.period_type;
	var year = req.body.year;
	var period_value = req.body.period_value;

	var cond = {
		client: client,
		year: year,
		ai_status: {
			$in: nums
		},
		period_type: period_type,
		period_value: parseInt(period_value) - 1
	};

	var companys = []
	if (req.body.companys) {
		companys = JSON.parse(req.body.companys);
	};
	if (companys.length > 0) {
		cond.company = {
			$in: companys
		}
	};
	var joblevel_names = []
	if (req.body.joblevel_names) {
		joblevel_names = JSON.parse(req.body.joblevel_names);
	};
	if (joblevel_names.length > 0) {
		cond.joblevel_name = {
			$in: joblevel_names
		}
	};
	var jobrank_names = []
	if (req.body.jobrank_names) {
		jobrank_names = JSON.parse(req.body.jobrank_names);
	};
	if (jobrank_names.length > 0) {
		cond.jobrank_name = {
			$in: jobrank_names
		}
	};
	var ous = []
	if (req.body.ous) {
		ous = JSON.parse(req.body.ous);
	};
	if (ous.length > 0) {
		cond.ou = {
			$in: ous
		}
	};
	var p_w = [{
		path: 'people',
		select: '_id people_name position jobrank ou_name people_no employee_status company_name'
	}, {
		path: 'qualitative_pis.items.pi',
		select: '_id pi_name'
	}, {
		path: 'quantitative_pis.items.pi',
		select: '_id pi_name'
	}]
	AssessmentInstance.find(cond)
		.populate(p_w).exec(function(err, ais) {
			res.json({
				code: 'OK',
				result: ais,
			})

		})
}
var emp_performance_funnel = function(req, res) {
	var i18n = req.i18n;
	var client = req.user.client.id;
	var render_data = {
		title: '报表－绩效合同状态漏斗图',
		user: req.user,
		_: _,
		moment: moment,

	};
	res.render('user/user_report/rp_emp_funnel', render_data);
}
var emp_performance_funnel_json = function(req, res) {
	var client = req.user.client.id;
	var period_type = req.body.period_type;
	var year = req.body.year;
	var period_value = req.body.period_value;

	var cond = {
		client: client,
		year: year,
		period_type: period_type,
		period_value: parseInt(period_value) - 1
	};

	var companys = []
	if (req.body.companys) {
		companys = JSON.parse(req.body.companys);
	};
	if (companys.length > 0) {
		cond.company = {
			$in: companys
		}
	};
	var joblevel_names = []
	if (req.body.joblevel_names) {
		joblevel_names = JSON.parse(req.body.joblevel_names);
	};
	if (joblevel_names.length > 0) {
		cond.joblevel_name = {
			$in: joblevel_names
		}
	};
	var jobrank_names = []
	if (req.body.jobrank_names) {
		jobrank_names = JSON.parse(req.body.jobrank_names);
	};
	if (jobrank_names.length > 0) {
		cond.jobrank_name = {
			$in: jobrank_names
		}
	};
	var ous = []
	if (req.body.ous) {
		ous = JSON.parse(req.body.ous);
	};
	if (ous.length > 0) {
		cond.ou = {
			$in: ous
		}
	};

	AssessmentInstance.find(cond)
		.populate({
			path: 'people',
			select: '_id avatar subordinates jobrank people_name tel cell email company_name position_name ou_name people_no employee_status company_name'
		}).exec(function(err, ais) {
			res.json({
				code: 'OK',
				result: ais,
			})

		})
}
var get_company = function(req, res) {
	Company.find({
		_id: {
			$in: req.user.companies
		}
	}, function(err, company) {
		res.json({
			code: 'OK',
			result: company,
		})
	})

}
var emp_performance_competence = function(req, res) {
	var i18n = req.i18n;
	var client = req.user.client.id;
	var render_data = {
		title: '报表－员工绩效得分对比',
		user: req.user,
		_: _,
		moment: moment,
		position: req.user.people.position,
		parttime_positions: JSON.stringify(req.user.people.parttime_positions),
	};
	res.render('user/user_report/rp_emp_competence', render_data);
}
var emp_performance_competence_json = function(req, res) {
	var client = req.user.client.id;
	var period_type = req.body.period_type;
	var period_value = req.body.period_value;
	var cond = {
		client: client,
		ai_status: {
			$in: nums
		},
		period_type: period_type,
		period_value: parseInt(period_value) - 1
	};
	if (req.body.people_objs) {
		var people_obj = JSON.parse(req.body.people_objs);
		cond["$and"] = [];
		if (people_obj.length > 0) {
			cond["$and"].push({
				$or: people_obj
			})
		};
	};

	cond.year = req.body.year || moment().format('YYYY'); //查询当年的
	var p_w = [{
		path: 'people',
		select: '_id people_name position jobrank ou_name people_no employee_status company_name'
	}, {
		path: 'qualitative_pis.items.pi',
		select: '_id pi_name'
	}, {
		path: 'quantitative_pis.items.pi',
		select: '_id pi_name'
	}]
	async.parallel({
		ais: function(cb) {
			AssessmentInstance.find(cond)
				.populate(p_w).exec(cb);
		},
		o_plans: function(cb) {
			var c_p = _.omit(cond, 'ai_status');
			c_p.op_status = '6'
			ObjectivePlan.find(c_p, cb)
		}
	}, function(err, result) {
		res.json({
			code: 'OK',
			result: result.ais,
			o_plans: result.o_plans
		})
	})

}
var emps_performance_competence = function(req, res) {
	var i18n = req.i18n;
	var client = req.user.client.id;
	var render_data = {
		title: '报表－员工绩效得分趋势',
		user: req.user,
		_: _,
		moment: moment,
		position: req.user.people.position,
		parttime_positions: JSON.stringify(req.user.people.parttime_positions),
	};
	res.render('user/user_report/rp_emps_competence', render_data);
}
var emps_performance_competence_json = function(req, res) {

	var client = req.user.client.id;
	var year = req.body.year;
	var year_t = req.body.year_t;
	var cond = {
		client: client,
		year: year,
		ai_status: {
			$in: nums
		},
		period_type: req.body.period_type,
	};
	var range_years = _.range(parseInt(year), parseInt(year_t) + 1);
	var years = []
	_.each(range_years, function(r) {
		years.push(String(r))
	})
	if (years.length > 0) {
		cond.year = {
			$in: years
		};
	};
	if (req.body.people_objs) {
		var people_obj = JSON.parse(req.body.people_objs);
		cond["$and"] = [];
		if (people_obj.length > 0) {
			cond["$and"].push({
				$or: people_obj
			})
		};
	};
	AssessmentInstance.find(cond)
		.populate({
			path: 'people',
			select: '_id people_name position jobrank ou_name people_no employee_status company_name'
		}).exec(function(err, ais) {
			res.json({
				code: 'OK',
				result: ais,
			})
		});
}
//目标得分-柱壮图
var pep_performance_object_score_histogram = function(req, res) {
	var i18n = req.i18n;
	var client = req.user.client.id;
	var render_data = {
		title: '报表－员工目标得分',
		user: req.user,
		_: _,
		moment: moment,
		position: req.user.people.position,
		parttime_positions: JSON.stringify(req.user.people.parttime_positions),

	};
	res.render('user/user_report/pep_performance_object_score_histogram', render_data);
}
var pep_performance_object_score_histogram_json = function(req, res) {

	var client = req.user.client.id;
	var period_type = req.body.period_type;
	var period_value = req.body.period_value;
	var cond = {
		client: client,
		op_status: '6',
		period_type: period_type == 0 ? '3' : period_type,
		period_value: period_value == 0 ? 0 : parseInt(period_value) - 1
	};
	if (req.body.people_objs) {
		var people_obj = JSON.parse(req.body.people_objs);
		cond["$and"] = [];
		if (people_obj.length > 0) {
			cond["$and"].push({
				$or: people_obj
			})
		};
	};
	cond.year = req.body.year || moment().format('YYYY'); //查询当年的
	var p_w = [{
		path: 'people',
		select: '_id people_name position jobrank joblevel ou_name people_no employee_status company_name'
	}, {
		path: 'items.ol',
		select: '_id ol_name'
	}, {
		path: 'items.pis.pi',
		select: '_id pi_name'
	}]
	ObjectivePlan.find(cond)
		.populate(p_w).exec(function(err, ops) {
			if (err) {
				return res.json({
					code: 'ERR',
					msg: '内部服务器错误：' + err
				});
			}
			if (ops) {
				res.json({
					code: 'OK',
					result: ops ? ops : '',
				})
			}
		});
}
var pep_performance_object_score_tendency = function(req, res) {
	var i18n = req.i18n;
	var client = req.user.client.id;
	var render_data = {
		title: '报表－组织目标得分',
		user: req.user,
		_: _,
		moment: moment,
		// company_temp: req.user.people.company,
		// company_temp_name: req.user.people.company_name
	};
	res.render('user/user_report/pep_performance_object_score_tendency', render_data);
}
var pep_performance_object_score_tendency_json = function(req, res) {
	var client = req.user.client.id;
	var period_type = req.body.period_type;
	var year = req.body.year;
	var year_t = req.body.year_t;
	var months = req.body.months;
	var months_t = req.body.months_t;
	var cond = {
		client: client,
		year: year == 1 ? moment().year() : year,
		op_status: '6',
		period_type: period_type == 0 ? '3' : period_type,
	};
	if (year && year_t) {
		var range_years = _.range(parseInt(year), parseInt(year_t) + 1);
		var years = []
		_.each(range_years, function(r) {
			years.push(String(r))
		})
		if (years.length > 0) {
			cond.year = {
				$in: years
			};
		};
	}
	var companys = []
	if (req.body.companys) {
		companys = JSON.parse(req.body.companys);
	};
	if (companys.length > 0) {
		cond.company = {
			$in: companys
		}
	};
	var joblevel_names = []
	if (req.body.joblevel_names) {
		joblevel_names = JSON.parse(req.body.joblevel_names);
	};
	var ous = []
	if (req.body.ous) {
		ous = JSON.parse(req.body.ous);
	};
	if (ous.length > 0) {
		cond.ou = {
			$in: ous
		}
	};
	var p_w = [{
		path: 'people',
		select: '_id people_name position jobrank joblevel ou_name people_no employee_status company_name'
	}]
	async.parallel({
		companys: function(cb) {
			Company.find({
				client: client
			}, function(err, compans) {
				var ids = [];
				var ids_name = [];
				_.each(compans, function(c) {
					ids.push(c._id);
					ids_name.push(c.company_name);
				})
				cb(null, _.object(ids, ids_name))
			})
		},
		ous: function(cb) {
			OrganizationUnit.find({
				client: client
			}, function(err, ous) {
				var ids = [];
				var ids_name = [];
				_.each(ous, function(c) {
					ids.push(c._id);
					ids_name.push(c.ou_name);
				})
				cb(null, _.object(ids, ids_name))
			})
		},
		ops: function(cb) {
			ObjectivePlan.find(cond)
				.populate(p_w).sort({
					'period_value': 1
				}).exec(cb)
		},
	}, function(err, result) {
		res.json({
			code: 'OK',
			result: result.ops,
			companys: result.companys,
			ous: result.ous
		})
	})
}
var emp_performance_object_scatter = function(req, res) {
	var i18n = req.i18n;
	var client = req.user.client.id;
	var render_data = {
		title: '报表－目标,绩效得分散点图',
		user: req.user,
		_: _,
		moment: moment
	};
	res.render('user/user_report/rp_emp_object_scatter', render_data);

}
var emp_performance_object_scatter_json = function(req, res) {


	var client = req.user.client.id;
	var period_type = req.body.period_type;
	var year = req.body.year;
	var period_value = req.body.period_value;

	var cond = {
		client: client,
		year: year,
		ai_status: {
			$in: nums
		},
		period_type: period_type,
		period_value: parseInt(period_value) - 1
	};

	var companys = []
	if (req.body.companys) {
		companys = JSON.parse(req.body.companys);
	};
	if (companys.length > 0) {
		cond.company = {
			$in: companys
		}
	};
	var ous = []
	if (req.body.ous) {
		ous = JSON.parse(req.body.ous);
	};
	if (ous.length > 0) {
		cond.ou = {
			$in: ous
		}
	};
	var c_p = _.clone(cond);
	var joblevel_names = []
	if (req.body.joblevel_names) {
		joblevel_names = JSON.parse(req.body.joblevel_names);
	};
	if (joblevel_names.length > 0) {
		cond.joblevel_name = {
			$in: joblevel_names
		}
	};

	async.parallel({
		ais: function(cb) {
			AssessmentInstance.find(cond)
				.populate({
					path: 'people',
					select: '_id avatar subordinates jobrank people_name tel cell email company_name position_name ou_name people_no employee_status company_name'
				}).exec(cb);
		},
		o_plans: function(cb) {
			c_p = _.omit(c_p, 'ai_status');
			c_p.op_status = '6'
			ObjectivePlan.find(c_p, cb)
		}
	}, function(err, result) {
		res.json({
			code: 'OK',
			result: result.ais,
			o_plans: result.o_plans
		})
	})
}

var charts = function(req, res) {
	var i18n = req.i18n;
	var client = req.user.client.id;
	var render_data = {
		title: '绩效仪表盘',
		user: req.user,
		_: _,
		rf_auth: true,
		moment: moment
	};
	res.render('user/user_report/charts', render_data);
}

var emp_myperformance = function(req, res) {
	var i18n = req.i18n;
	var client = req.user.client.id;
	var render_data = {
		title: '个人绩效历史查询表',
		user: req.user,
		_: _,
		moment: moment,
		position: req.user.people.position,
		parttime_positions: JSON.stringify(req.user.people.parttime_positions),
	};
	res.render('user/user_report/rp_emp_myperformance', render_data);
}
var horoscope_config = function(req, res) {
	var i18n = req.i18n;
	var client = req.user.client.id;
	var render_data = {
		title: '九宫图-配置',
		user: req.user,
		_: _,
		moment: moment,
	};
	HoroScope.findOne({
		client: client
	}).exec(function(err, result) {
		if (err) {
			return res.json({
				code: 'ERR',
				msg: '内部服务器错误：' + err
			})
		}
		if (result) {
			render_data.result = result;
			res.render('user/user_report/horoscope', render_data);
		} else {
			var obj = {},
				color = [];
			obj = {
				x_title: '绩效',
				xis_max: 100,
				x_a: 30,
				x_b: 70,
				y_title: '潜能',
				yis_max: 100,
				y_a: 30,
				y_b: 70
			}
			var color_type = ['red', 'yellow', 'purple', 'orange', 'gray', 'LightGreen', 'Blue', 'SteelBlue', 'green'];
			for (var i = 1; i <= 9; i++) {
				color.push({
					block_name: i, //块名称
					color_type: color_type[i - 1], //颜色
					color_des_category: i,
					color_description: i
				})
			}
			obj.color = color;
			obj.client = client;
			HoroScope.create(obj, function(err, horo) {
				render_data.result = horo;
				res.render('user/user_report/horoscope', render_data);
			})
		}
	})

}
var horoscope_update = function(req, res) {
	var client = req.user.client.id;
	var up_id = req.params.up_id;
	async.waterfall([

		function(cb) {
			HoroScope.findById(up_id).exec(cb)
		},
		function(up, cb) {
			up.color = req.body.color ? req.body.color : '';
			up.xis_max = req.body.xis_max;
			up.yis_max = req.body.yis_max;
			up.x_title = req.body.x_title;
			up.y_title = req.body.y_title;
			up.x_a = req.body.x_a;
			up.x_b = req.body.x_b;
			up.y_a = req.body.y_a;
			up.y_b = req.body.y_b;
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
				msg: sprintf('九宫图配置保存成功！'),
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
var horoscope_fetch = function(req, res) {
	var i18n = req.i18n;
	var up_id = req.params.up_id;
	HoroScope.findById(up_id).exec(function(err, result) {
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
var horoscope_list = function(req, res) {
	var i18n = req.i18n;
	var client = req.user.client.id;
	HoroScope.find({
		client: client
	}).exec(function(err, horos) {
		if (err) {
			return res.json({
				code: 'ERR',
				msg: '内部服务器错误：' + err
			});
		} else {
			return res.json(horos);
		};
	})
}
var performance_360_scatter = function(req, res) {
	var i18n = req.i18n;
	var client = req.user.client.id;
	var render_data = {
		title: '人才能力盘点-散列图',
		user: req.user,
		_: _,
		moment: moment
	};
	res.render('user/user_report/360_performance_scatter', render_data);

}
var performance_360_scatter_json = function(req, res) {


	var client = req.user.client.id;
	var period_type = req.body.period_type;
	var year = req.body.year;
	var year_t = req.body.year_t;


	var cond = {
		client: client,
		year: year,
		ai_status: {
			$in: nums
		},
		period_type: period_type,
	};
	var cond_period = {
		client: client,
		year: year,
		period_type: period_type,
	}
	var range_years = _.range(parseInt(year), parseInt(year_t) + 1);
	var years = []
	_.each(range_years, function(r) {
		years.push(String(r))
	})
	if (years.length > 0) {
		cond.year = {
			$in: years
		};
		cond_period.year = {
			$in: years
		}
	};
	var companys = []
	if (req.body.companys) {
		companys = JSON.parse(req.body.companys);
	};
	if (companys.length > 0) {
		cond.company = {
			$in: companys
		}
	};
	var ous = []
	if (req.body.ous) {
		ous = JSON.parse(req.body.ous);
	};
	if (ous.length > 0) {
		cond.ou = {
			$in: ous
		}
	};
	var c_p = _.clone(cond);
	var joblevel_names = []
	if (req.body.joblevel_names) {
		joblevel_names = JSON.parse(req.body.joblevel_names);
	};
	if (joblevel_names.length > 0) {
		cond.joblevel_name = {
			$in: joblevel_names
		}
	};
	async.parallel({
		ais: function(cb) {
			AssessmentInstance.find(cond)
				.populate({
					path: 'people',
					select: '_id avatar subordinates jobrank people_name tel cell email company_name position_name ou_name people_no employee_status company_name'
				}).exec(cb);
		},
		o_plans: function(cb) {
			async.waterfall([

				function(cb) {
					PeriodManagement.find(cond_period).exec(function(err, result) {
						var arr = [];
						_.each(result, function(temp) {
							arr.push(temp._id)
						})
						cb(null, arr)
					})
				},
				function(period, cb) {
					var cond_ques = {
						client: client,
						period: {
							$in: period
						}
					}
					Questionnair360AndCAInstance.find(cond_ques, cb)
				}
			], cb)
		},
		horoscope: function(cb) {
			HoroScope.find({
				client: client
			}).exec(cb)
		}
	}, function(err, result) {
		res.json({
			code: 'OK',
			result: result.ais,
			o_plans: result.o_plans,
			horoscope: result.horoscope
		})
	})
}
var performance_360_tendency = function(req, res) {
	var i18n = req.i18n;
	var client = req.user.client.id;
	var render_data = {
		title: '人才能力绩效对比',
		user: req.user,
		_: _,
		moment: moment
	};
	res.render('user/user_report/360_performance_tendency', render_data);

}
var performance_360_tendency_json = function(req, res) {
	var client = req.user.client.id;
	var year = req.body.year;
	var year_t = req.body.year_t;
	var cond = {
		client: client,
		year: year,
		ai_status: {
			$in: nums
		},
		period_type: req.body.period_type,
	};
	var cond_period = {
		client: client,
		year: year,
		period_type: req.body.period_type
	}
	var cond_ques = {
		client: client
	}
	var range_years = _.range(parseInt(year), parseInt(year_t) + 1);
	var years = []
	_.each(range_years, function(r) {
		years.push(String(r))
	})
	if (years.length > 0) {
		cond.year = {
			$in: years
		};
		cond_period.year = {
			$in: years
		}
	};

	if (req.body.emps) {
		var emps = JSON.parse(req.body.emps);
		cond.people = {
			$in: emps
		};
		cond_ques.people = {
			$in: emps
		};
	};
	async.parallel({
		ais: function(cb) {
			AssessmentInstance.find(cond)
				.populate({
					path: 'people',
					select: '_id avatar subordinates jobrank position people_name tel cell email company_name position_name ou_name people_no employee_status company_name'
				}).exec(cb);
		},
		question_360: function(cb) {
			async.waterfall([

				function(cb) {
					PeriodManagement.find(cond_period).exec(function(err, result) {
						var arr = [];
						_.each(result, function(temp) {
							arr.push(temp._id)
						})
						cb(null, arr)
					})
				},
				function(period, cb) {
					cond_ques.period = {
						$in: period
					}
					Questionnair360AndCAInstance.find(cond_ques, cb)
				},

			], cb)
		},
		horoscope: function(cb) {
			HoroScope.find({
				client: client
			}).exec(cb)
		}
	}, function(err, result) {
		res.json({
			code: 'OK',
			result: result.ais,
			question_360: result.question_360,
			horoscope: result.horoscope
		})
	})
}

//人才管理
var talent_manage_list = function(req, res) {
	var i18n = req.i18n;
	var client = req.user.client.id;
	var render_data = {
		title: '人才管理',
		user: req.user,
		moment: moment,
		_: _
	};
	TalentLambda.find({
		client: client
	}).exec(function(err, result) {
		render_data.lambda = result;
		res.render('user/user_report/talent_manage', render_data);

	})
}
//人才分布九宫图
//人才管理
var talent_scatter = function(req, res) {
	var i18n = req.i18n;
	var client = req.user.client.id;
	var render_data = {
		title: '人才-九宫图',
		user: req.user,
		moment: moment,
		_: _
	};
	TalentLambda.find({
		client: client
	}).exec(function(err, result) {
		render_data.lambda = result;
		res.render('user/user_report/talent_lambda/talent_scatter', render_data);

	})
}
//人才数据
var input_help_peps = function(req, res) {
	var client = req.user.client.id;
	async.parallel({
		joblevels: function(cb) { //层级
			JobLevel.find({
				client: client,
				block: false,
				activate: true
			}, cb)
		},
		peps: function(cb) { //职级
			People.find({
				client: client,
				block: false
			}).populate('position').exec(cb)
		}
	}, function(err, result) {
		if (err) {
			res.json({
				code: 'ERR',
				msg: '内部服务器错误：' + err
			});
		};
		return res.json({
			data: result.peps
		})
	})

}
var input_help_lambda = function(req, res) {
	var client = req.user.client.id;
	async.parallel({
		lambda: function(cb) { //层级
			TalentLambda.find({
				client: client
			}).exec(cb)
		},
		lambda_type: function(cb) { //层级
			TalentType.find({
				client: client
			}).exec(cb)
		},
		peps: function(cb) { //职级
			People.find({
				client: client,
				block: false
			}).populate('position').exec(cb)
		},
		horoscope: function(cb) {
			HoroScope.find({
				client: client
			}).exec(cb)
		},
		payroll: function(cb) {
			PayrollPeopleInstance.find({
				client: client
			}).exec(cb)
		},
		pay_item: function(cb) {
			PayrollItemClient.findOne({
				client: client,
				pri_category: '3'
			}).exec(cb)
		},
		ai_data: function(cb) {
			AssessmentInstance.find({
				client: client,
				ai_status: {
					$in: nums
				}
			}).exec(cb)
		},
		ques_360: function(cb) {
			Questionnair360AndCAInstance.find({
				client: client,
				status: {
					$in: ['1', '2']
				}
			}).populate('period').exec(cb)
		},
		talent_pool: function(cb) {
			TalentPool.find({
				client: client
			}).populate('talent_type').exec(cb)
		}
	}, function(err, result) {
		if (err) {
			res.json({
				code: 'ERR',
				msg: '内部服务器错误：' + err
			});
		};
		return res.json({
			data: result
		})

	})

}
//data
var people_help_json = function(req, res) {
	var user = req.user;
	var client = req.user.client;
	var p_type = req.params.p_type;
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
				}
			}, cb);
		},
		function(dc, cb) {
			var ret_data = [];
			_.each(dc.joblevels, function(jl) {
				var pos_count = 0; //层级下的职位总数
				var jl_jr = _.filter(dc.jobranks, function(jr) {
					return _.isEqual(jr.joblevel, jl._id)
				})
				_.each(jl_jr, function(jr) {
					var jr_pos = _.filter(dc.positions, function(pos) {
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
							'code': pos.position_code,
							'position_code': pos.position_code,
							'position_name': pos.position_name,
							'company_name': pos.company ? pos.company.company_name : '<未分配公司>',
							'ou_name': pos.belongto_ou ? pos.belongto_ou.ou_name : '<未分配部门>',
							'joblevel_name': jl.joblevel_name,
							'is_key': pos.is_key,
							'position_manager': pos.position_manager

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
					var f_ps = _.filter(dc.pos, function(p) {
						return p.belongto_ou._id == String(o._id)
					})
					_.each(f_ps, function(p) {
						if (p.position_manager) {
							if (!p.position_direct_superior) {
								var row = {
									'id': p._id,
									'pId': o._id,
									'name': sprintf('<span class="label label-info" style="padding:1px;">%s</span>', p.position_name),
									'type': 'p',
									'position_name': p.position_name,
									'code': p.position_code,
									'is_key': p.is_key ? p.is_key : false,
									'position_manager': p.position_manager ? p.position_manager : false
								};
								ret_data.push(row);
							} else {
								if (p.position_direct_superior.belongto_ou._id == String(o._id)) {
									var row = {
										'id': p._id,
										'pId': p.position_direct_superior._id,
										'name': sprintf('<span class="label label-info" style="padding:1px;">%s</span>', p.position_name),
										'type': 'p',
										'position_name': p.position_name,

										'code': p.position_code,

										'is_key': p.is_key ? p.is_key : false,
										'position_manager': p.position_manager ? p.position_manager : false
									};
									ret_data.push(row);
								} else {
									var row = {
										'id': p._id,
										'pId': o._id,
										'name': sprintf('<span class="label label-info" style="padding:1px;">%s</span>', p.position_name),
										'type': 'p',
										'position_name': p.position_name,

										'code': p.position_code,

										'is_key': p.is_key ? p.is_key : false,
										'position_manager': p.position_manager ? p.position_manager : false
									};
									ret_data.push(row);
								}
							}
						} else {
							if (!p.position_direct_superior) {
								var row = {
									'id': p._id,
									'pId': o._id,
									'position_name': p.position_name,

									'name': p.position_name,
									'code': p.position_code,

									'type': 'p',
									'is_key': p.is_key ? p.is_key : false,
									'position_manager': p.position_manager ? p.position_manager : false
								};
								ret_data.push(row);
							} else {
								if (p.position_direct_superior.belongto_ou._id == String(o._id)) {
									var row = {
										'id': p._id,
										'pId': p.position_direct_superior._id,
										'name': p.position_name,
										'code': p.position_code,
										'position_name': p.position_name,
										'type': 'p',
										'is_key': p.is_key ? p.is_key : false,
										'position_manager': p.position_manager ? p.position_manager : false
									};
									ret_data.push(row);
								} else {
									var row = {
										'id': p._id,
										'pId': o._id,
										'name': p.position_name,
										'code': p.position_code,
										'position_name': p.position_name,
										'type': 'p',
										'is_key': p.is_key ? p.is_key : false,
										'position_manager': p.position_manager ? p.position_manager : false
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
//人才盘点
var talent_lambda_bbform = function(req, res) {
	var i18n = req.i18n;
	var client = req.user.client.id;
	var render_data = {
		title: '人才盘点',
		user: req.user,
		moment: moment,
		_: _
	};
	var up_id = req.query.up_id;
	TalentLambda.findById(up_id).exec(function(err, result) {
		if (err) {
			return res.json({
				code: 'ERR',
				msg: '内部服务器错误：' + err
			});
		}
		render_data.lambda = result ? result : '';
		res.render('user/user_report/talent_lambda_bbform', render_data);

	})
}
var talent_lambda_bb_list = function(req, res) {
	var i18n = req.i18n;
	var client = req.user.client.id;
	var render_data = {
		title: '人才盘点',
		user: req.user,
		moment: moment,
		_: _
	};
	res.render('user/user_report/talent_lambda/talent_lambda_bb_list', render_data);
}
var talent_lambda_bb = function(req, res) {
	var i18n = req.i18n;
	var client = req.user.client.id;
	TalentLambda.find({
		client: client
	}).exec(function(err, result) {
		if (err) {
			return res.json({
				code: 'ERR',
				msg: '内部服务器错误：' + err
			});
		} else {
			// factors.push(obj);
			return res.json(result);
		};
	})
}
var talent_lambda_create = function(req, res) {
	var i18n = req.i18n;
	var client = req.user.client.id;
	var up_id = req.params.up_id;
	var data4create = {
		client: client,
		lambda_name: req.body.lambda_name
	}
	TalentLambda.create(data4create, function(err, result) {
		if (err) {
			return res.status(500).json({
				code: 'ERR',
				msg: '内部服务器错误：' + err
			});
		};
		if (result) {
			return res.json({
				code: 'OK',
				msg: sprintf('人才盘点 <strong>%s</strong> 保存成功！', result.lambda_name),
				_id: result._id,
			});
		} else {
			return res.status(500).json({
				code: 'ERR',
				msg: '人才盘点保存失败'
			});
		};
	})
}
var talent_lambda_fetch = function(req, res) {
	var i18n = req.i18n;
	var up_id = req.params.up_id;
	TalentLambda.findById(up_id).exec(function(err, result) {
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
var talent_lambda_update = function(req, res) {
	var i18n = req.i18n;
	var up_id = req.params.up_id;
	async.waterfall([

		function(cb) {
			TalentLambda.findById(up_id, cb);
		},
		function(up, cb) {
			up.lambda_name = req.body.lambda_name;
			up.ai_weight = req.body.ai_weight;
			up.com_weight = req.body.com_weight;
			up.lambda_ques_360 = req.body.lambda_ques_360;
			up.lambda_ai_period = req.body.lambda_ai_period;
			up.lambda_period = req.body.lambda_period;
			up.lambda_data = req.body.lambda_data;
			up.lambda_object = req.body.lambda_object;
			up.is_save = req.body.is_save;
			up.lambda_date = req.body.lambda_date;

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
				msg: sprintf('人才盘点 <strong>%s</strong> 保存成功！', result.lambda_name),
				_id: result._id,
			});
		} else {
			return res.status(500).json({
				code: 'ERR',
				msg: '人才盘点保存失败'
			});
		};
	})
}
var talent_lambda_delete = function(req, res) {
	var i18n = req.i18n;
	var up_id = req.params.up_id;
	TalentLambda.findByIdAndRemove(up_id, function(err, up) {
		if (err) {
			return res.status(500).json({
				code: 'ERR',
				msg: '内部服务器错误：' + err
			});
		};
		if (up) {
			return res.json({
				code: 'OK',
				msg: sprintf('人才盘点 <strong>%s</strong> 删除成功！', up.lambda_name),
			});
		} else {
			return res.status(500).json({
				code: 'ERR',
				msg: '人才盘点删除失败'
			});
		};
	})
}
var talent_lambda_json = function(req, res) {
	var client = req.user.client.id;
	var lambda_id = req.body.lambda_id;

	async.waterfall([

		function(cb) {
			TalentLambda.findById(lambda_id).exec(cb)
		},
		function(talent, cb) {
			var ai_period = [],
				ques_period = [];

			_.each(talent.lambda_ai_period, function(temp) {
				ai_period.push(temp.period)
			})
			_.each(talent.lambda_ques_360, function(temp) {
				ques_period.push(temp.period)
			})
			var obj = {};
			obj.ai_period = ai_period;
			obj.ques_period = ques_period;
			obj.ai_weight = talent.ai_weight ? talent.ai_weight : 0;
			obj.com_weight = talent.com_weight ? talent.com_weight : 0;
			obj.position = talent.lambda_object ? talent.lambda_object : '';
			cb(null, obj)
		},
		function(filter_obj, cb) {
			var ai_weight = filter_obj.ai_weight;
			var com_weight = filter_obj.com_weight;
			var cond = {
				client: client,
				ai_status: {
					$in: nums
				},
				period: {
					$in: filter_obj.ai_period
				},
				position: {
					$in: filter_obj.position
				}
			};
			var cond_ques = {
				client: client,
				status: {
					$in: ['1', '2']
				},
				period: {
					$in: filter_obj.ques_period
				},
				position: {
					$in: filter_obj.position
				}
			};
			async.parallel({
				ais: function(cb) {
					AssessmentInstance.find(cond)
						.populate({
							path: 'people',
							select: '_id avatar subordinates jobrank position people_name tel cell email company_name position_name ou_name people_no employee_status company_name'
						}).exec(cb)
				},
				question_360: function(cb) {
					Questionnair360AndCAInstance.find(cond_ques).populate({
						path: 'people',
						select: '_id avatar subordinates jobrank position people_name tel cell email company_name position_name ou_name people_no employee_status company_name'
					}).exec(cb)
				},
				horoscope: function(cb) {
					HoroScope.find({
						client: client
					}).exec(cb)
				},
				people: function(cb) {
					People.find({
						client: client
					}).exec(cb)
				}
			}, function(err, result) {
				var ais = result.ais ? result.ais : '';
				var ques = result.question_360 ? result.question_360 : ''
				//判断季度还是月度
				var ai_data = _.groupBy(result.ais, function(q) {
					return q.period
				})
				var ques_data = _.groupBy(result.question_360, function(q) {
					return q.period

				})
				var ai_key = _.keys(ai_data);
				var ques_key = _.keys(ques_data);
				var ai_value = _.values(ai_data);
				var ques_value = _.values(ques_data);
				//盘点列表数组
				var data = [];

				if (ai_key.length > ques_key.length) {
					_.each(ais, function(a) {
						var score_pep_ai = 0,
							score_pep_ques = 0,
							ai_len = 0,
							abl_len = 0;
						var obj = {};
						_.each(ai_value, function(ai) {
							var query_data = _.find(ai, function(g) {
								return String(g.people._id) == a.people._id
							})
							if (query_data) {
								ai_len++;

								var ques_filter = _.find(ques, function(q) {
									return q.period == String(a.period) && q.people._id == String(a.people._id)
								})
								if (ques_filter) {
									abl_len++;
								}
							}
							score_pep_ai += query_data ? changeTwoDecimal(query_data.ai_score) : 0;
							score_pep_ques += ques_filter ? changeTwoDecimal(ques_filter.score) : 0;

						})
						if (score_pep_ai && score_pep_ques) {
							obj.people_name = a.people.people_name;
							obj.people_no = a.people.people_no;
							obj.company_name = a.people.company_name;
							obj.position_name = a.people.position_name;
							obj.ou_name = a.people.ou_name;
							obj.position = a.position;
							obj.people = a.people._id;
							// obj.period_name = a.period_name;
							obj.ai_score = changeTwoDecimal(score_pep_ai / ai_len);
							obj.score = changeTwoDecimal(score_pep_ques / abl_len);
							obj.total_score = changeTwoDecimal((score_pep_ai / ai_len) * (ai_weight / 100) + (score_pep_ques / abl_len) * (com_weight / 100))
							data.push(obj)
						}


					})
				} else {
					_.each(ques, function(a) {
						var score_pep_ai = 0,
							score_pep_ques = 0,
							ai_len = 0,
							abl_len = 0;
						var obj = {};
						_.each(ques_value, function(ques) {
							var query_data = _.find(ques, function(g) {
								return String(g.people._id) == a.people._id
							})
							if (query_data) {
								abl_len++;

								var ai_filter = _.find(ais, function(q) {
									return q.period == String(a.period) && q.people._id == String(a.people._id)
								})
								if (ai_filter) {
									ai_len++;
								}
							}
							score_pep_ques += query_data ? changeTwoDecimal(query_data.score) : 0;
							score_pep_ai += ai_filter ? changeTwoDecimal(ai_filter.ai_score) : 0;

						})
						if (score_pep_ai && score_pep_ques) {
							obj.people_name = a.people.people_name;
							obj.people_no = a.people.people_no;
							obj.company_name = a.people.company_name;
							obj.position_name = a.people.position_name;
							obj.ou_name = a.people.ou_name;
							obj.position = a.position;
							obj.people = a.people._id;
							// obj.period_name = a.period_name;
							obj.ai_score = changeTwoDecimal(score_pep_ai / ai_len);
							obj.score = changeTwoDecimal(score_pep_ques / abl_len);
							obj.total_score = changeTwoDecimal((score_pep_ai / ai_len) * (ai_weight / 100) + (score_pep_ques / abl_len) * (com_weight / 100))
							data.push(obj)
						}


					})
				}
				var rank = _.sortBy(data, function(temp) {
					return temp.total_score
				})
				rank = rank.reverse();
				var horo = result.horoscope[0] ? result.horoscope[0] : '';

				for (var i = 1; i <= rank.length; i++) {
					rank[i - 1].rank = i + '/' + rank.length;
					var horo_d = _.find(horo.color, function(temp) {
						return (rank[i - 1].ai_score > temp.x1 && rank[i - 1].ai_score <= temp.x2) && (rank[i - 1].score > temp.y1 && rank[i - 1].score <= temp.y2)
					})
					if (horo_d) {
						rank[i - 1].horoscope = horo_d.color_des_category
						rank[i - 1].horoscope_id = horo_d._id

					}

				}
				var obj = {};
				obj = {
					horoscope: result.horoscope ? result.horoscope : '',
					lambda_data: rank,
					people: result.people ? result.people : ''
				}
				cb(null, obj)
			})
		}
	], function(err, result) {
		var update_data = {
			lambda_data: result.lambda_data
		}
		TalentLambda.findByIdAndUpdate(lambda_id, update_data, function(err, data) {
			return res.json({
				code: 'OK',
				result: result,
				lambda_data: data.lambda_data
				// question_360: result.question_360,
				// horoscope: result.horoscope
			})
		})
	})
	//区间转换

}

	function changeTwoDecimal(x) {
		var f_x = parseFloat(x);
		if (isNaN(f_x)) {
			return false;
		}
		var f_x = Math.round(x * 100) / 100;

		return f_x;
	}
var input_help_360 = function(req, res) {
	var client = req.user.client.id;
	var render_data = {
		title: '问卷统计',
		user: req.user,
		// qtc_id: qtc_id,
	};
	res.render('user/user_report/talent_lambda/report360', render_data);
}
var period_inputhelp360 = function(req, res) {
	var client = req.user.client.id;
	var company = req.user.people ? req.user.people.company : null;
	var current_year = moment().year(); //当前年
	var prev_year = current_year - 1; //下一年

	PeriodManagement.find({
		client: client,
		company: company,
		block: false,
		activate: true,
		terminated: false,
		year: {
			$in: [current_year, prev_year]
		}
	}).sort({
		year: 1,
		period_type: 1,
		periodFrom: 1
	}).exec(function(err, periodManagements) {
		if (err) {
			req.app.locals.handle500(err, req, res);
		};
		res.render('user/user_report/talent_lambda/input_help360', {
			periodManagements: periodManagements,
			moment: moment,
		});
	})
}

var input_help_lambda_list = function(req, res) {
	var client = req.user.client.id;
	var render_data = {
		title: '人才盘点列表',
		user: req.user,
	};
	res.render('user/user_report/talent_lambda/talent_lambda_bb_input_help', render_data);
}
var talent_pool_list = function(req, res) {
	var i18n = req.i18n;
	var client = req.user.client.id;

	var render_data = {
		title: '人才池-状态报表',
		user: req.user,
		_: _,
		moment: moment
	};
	async.parallel({
		talent_type: function(cb) {
			TalentType.find({
				client: client
			}).exec(cb)
		},
		talent_lambda: function(cb) {
			TalentLambda.find({
				client: client,
				is_save: true
			}).exec(cb)
		}
	}, function(err, result) {
		var lambda = result.talent_lambda ? result.talent_lambda : '';
		var talent_type = result.talent_type ? result.talent_type : ''
		async.times(lambda.length, function(n, next) {
			var lambda_data = lambda[n].lambda_data;
			var lambda_temp = lambda[n];
			if (lambda_data.length > 0) {
				async.times(lambda_data.length, function(n, next) {
					var data = lambda_data[n];
					// console.log(data.horoscope_id);
					var type_data = _.find(talent_type, function(temp) {
						var horoscope = temp.horoscope;
						var item = [];
						_.each(horoscope, function(horo) {
							item.push(String(horo))
						})
						return !!~item.indexOf(data.horoscope_id)
					})
					// console.log(type_data);
					if (type_data) {
						var type_name = type_data ? type_data.type_name : '';
						var talent_type_id = type_data ? type_data._id : '';
						var createdata = {
							client: client,
							talent_type: talent_type_id,
							type_name: type_name,
							lambda_name: lambda_temp.lambda_name,
							talent_lambda: lambda_temp._id,
							people: data.people,
							// changeDate: moment(),
						}
						TalentPool.findOne({
							client: client,
							talent_lambda: lambda_temp._id,
							people: data.people
						}).exec(function(err, talent) {
							if (err) {
								return res.json({
									code: 'ERR',
									msg: '内部服务器错误：' + err
								});
							}
							if (talent) {
								talent.save(next)
							} else {
								TalentPool.create(createdata, next)
							}
						})
					} else {
						next(null, null)
					}

				}, next)
			} else {
				next(null, null)
			}

		}, function(err, result) {
			res.render('user/user_report/talent_lambda/talent_pool', render_data);

		})
	})
}
var talent_pool_json = function(req, res) {
	var client = req.user.client.id;
	var people = req.query.people;
	var talent_type = req.query.talent_type;
	var talent_lambda = req.query.talent_id;
	var change_reason = req.query.change_reason;
	var user = req.user.people._id;
	var user_name = req.user.people_name;
	async.parallel({

		change_type: function(cb) {
			TalentPool.findOne({
				client: client,
				people: people,
				history: false,
				talent_lambda: talent_lambda
			}).exec(function(err, result) {
				if (err) {
					return res.json({
						code: 'ERR',
						msg: '内部服务器错误：' + err
					});
				}
				if (result) {
					result.history = true;
					result.changeDate = moment();
					// result.change_reason = change_reason;
					result.save(cb);
				} else {
					cb(null, null)
				}
			})
		},
		talent_type: function(cb) {
			TalentType.find({
				client: client
			}).exec(cb)
		}
	}, function(err, result) {
		if (result.change_type) {
			var talenttype = _.find(result.talent_type, function(temp) {
				return temp._id == String(talent_type)
			})
			var change_data = {};
			//人才变更记录
			change_data = {
				from: result.change_type[0]._id,
				pool_name: result.change_type[0].type_name,
				operator: user,
				operator_name: user_name
			}
			var create_data = {
				client: client,
				people: people,
				talent_type: talent_type,
				talent_lambda: talent_lambda,
				type_name: talenttype.type_name,
				lambda_name: result.change_type[0].lambda_name,
				change_reason: change_reason,
				change_data: change_data,

			}
			TalentPool.findOne({
				client: client,
				talent_type: talent_type,
				people: people,
				histroy: false,
				talent_lambda: talent_lambda
			}).exec(function(err, pool) {
				if (pool) {
					pool.save()
					return res.json({
						code: 'OK',
						msg: sprintf('加入人才池%s成功!!!', pool.type_name)
					});
				} else {
					TalentPool.create(create_data, function(err, results) {
						if (err) {
							return res.json({
								code: 'ERR',
								msg: '内部服务器错误：' + err
							});
						}
						if (results) {
							return res.json({
								code: 'OK',
								msg: sprintf('加入人才池%s成功!!!', results.type_name)
							});
						}
					})
				}
			})

		} else {
			return res.json({
				err: 'ERROR',
				msg: '内部服务器错误'
			});
		}

	})


}


var talent_pool_fetch = function(req, res) {
	var i18n = req.i18n;
	var client = req.user.client.id;
	TalentPool.find({
		client: client
	})
		.populate('people talent_lambda adjust_payroll_data.adjust_payroll position_move_data.adjust_position position_up_data.adjust_position position_leave_data.adjust_position')
		.exec(function(err, result) {
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
var talent_pool_remind = function(req, res) {
	var i18n = req.i18n;
	var client_id = req.user.client.id;
	var user = req.user.id;
	var client = req.user.client;
	var people_id = req.body.people_id;
	var detail_data = req.body.detail_data || '';
	var msg_theme = req.body.msg_theme;
	var msg_body = req.body.msg_body;
	var lambda_obj = req.body.lambda_obj;
	var p_user_obj = req.body.p_user_obj;
	var user_name = req.user.people_name;

	us.each(people_id, function(r_user) {
		var d_data = detail_data[String(r_user)] ? detail_data[String(r_user)] : '';
		var contents = msg_body + d_data
		async.parallel({
			im: function(cb) {
				IM.send_msg(client_id, user, client_id, r_user, msg_theme, 'html', contents, function(err, data) {
					if (data) {
						cb(null, data)
					}
				})
			},
			lambda: function(cb) {
				TalentPool.findOne({
					client: client,
					people: p_user_obj[r_user],
					talent_lambda: lambda_obj[r_user]
				}).exec(function(err, result) {
					if (result) {
						var obj = {}
						obj.is_warning = true;
						obj.operator = user;
						obj.operator_name = user_name;
						obj.operate_date = moment();
						result.performance_warning.push(obj)
						result.save(cb)
					}

				})
			}

		}, function(err, data) {
			if (err) {
				return req.app.locals.handle500(err, req, res);
			};
			if (data.im) {
				res.json({
					code: 'OK',
					msg: '通知发送成功！'
				});

			}
		})
	})
	// IM.send_msg(client_id, user, client_id, r_user, msg_theme, 'html', contents, function(err, data) {
	// 	if (err) {
	// 		return req.app.locals.handle500(err, req, res);
	// 	};
	// 	if (data) {
	// 		res.json({
	// 			code: 'OK',
	// 			msg: '通知发送成功！'
	// 		});

	// 	}
	// })
}
var performance_download_json = function(req, res) {
	var client = req.user.client._id;
	var data = JSON.parse(req.query.datas)
	// console.log(datas);
	var cond = {
		client: client,
		ai_status: {
			$in: nums
		},
	};

	if (data.year && data.year_t) {
		var year = parseInt(data.year);
		var year_t = parseInt(data.year_t);
		var years = _.range(year, year_t + 1);
		years = _.map(years, function(y) {
			return String(y)
		})
		if (years.length > 0) {
			cond.year = {
				$in: years
			}
		};
	};
	var company = data.company; //查询当年的
	var personnelrange = data.personnelrange;
	var personnelsubrange = data.personnelsubrange;
	var cond_pm = [];
	if (data.annual == 0) { //年度
		cond_pm.push({
			period_type: '1',
			period_value: 0
		})
	};
	if (data.halfyear) { //半年
		cond_pm.push({
			period_type: '2',
			period_value: {
				$in: JSON.parse(data.halfyear)
			}
		})
	};
	if (data.quarter) { //季度
		cond_pm.push({
			period_type: '3',
			period_value: {
				$in: JSON.parse(data.quarter)
			}
		})
	};
	if (data.month) { //月度
		cond_pm.push({
			period_type: '4',
			period_value: {
				$in: JSON.parse(data.month)
			}
		})
	};
	if (cond_pm.length) {
		cond["$and"] = [];
		if (cond_pm.length) {
			cond["$and"].push({
				$or: cond_pm
			})
		};
		// if (cond_ss.length) {
		// 	cond["$and"].push({
		// 		$or: cond_ss
		// 	})
		// };
	};
	var people_status_title = {
		'P': '试用期',
		'H': '正式雇佣',
		'L': '停薪留职',
		'R': '已离职'
	};
	var conf = {};
	conf.cols = [{
		caption: '工 号',
		type: 'string'
	}, {
		caption: '姓 名',
		type: 'string'
	}, {
		caption: '任职状态',
		type: 'string'
	}, {
		caption: '公 司',
		type: 'string'
	}, {
		caption: '职 位',
		type: 'string'
	}, {
		caption: '部 门',
		type: 'string'
	}, {
		caption: '层 级',
		type: 'string'
	}, {
		caption: '考核周期',
		type: 'string'
	}, {
		caption: '得 分',
		type: 'number'
	}, {
		caption: '绩效等级',
		type: 'string'
	}, {
		caption: '强制等级',
		type: 'string'
	}, {
		caption: '部门绩效排名',
		type: 'string'
	}];

	async.series({
		companys: function(cb) {
			PersonnelRange.findById(personnelrange, function(err, personnelrange) {
				var items = [];
				if (company && personnelrange) {
					var f_c = us.find(personnelrange.compaines, function(c) {
						return String(c) == String(company)
					})
					if (f_c) {
						items.push(company)
					};
					cond.company = {
						$in: items
					}
				} else if (company || personnelrange) {
					if (company) {
						items.push(company)
					};
					if (personnelrange) {
						items = personnelrange.compaines
					};
					cond.company = {
						$in: items
					}
				}

				cb(null, null)

			});
		},
		ous: function(cb) {
			PersonnelSubRange.findById(personnelsubrange, function(err, per) {
				if (per) {
					cond.ou = {
						$in: per.ous
					}
					cb(null, per.ous)
				} else {
					cb(null, null)
				}
			})
		},
		ats: function(cb) {
			AssessmentInstance.find(cond)
				.populate({
					path: 'people',
					select: '_id people_name ou_name people_no employee_status company_name'
				}).exec(cb);
		},
	}, function(err, result) {
		if (err) {
			return res.send(500, err)
		};
		if (err) {
			return res.send(500, err)
		};
		conf.rows = [];
		_.each(result.ats, function(x) {
			var row = [];
			row.push(x.people.people_no); //col  1
			row.push(x.people.people_name); //col 2
			row.push(people_status_title[x.people.employee_status]); //col 
			row.push(x.people.company_name);
			row.push(x.position_name);
			row.push(x.people.ou_name)
			row.push(x.joblevel_name)
			row.push(x.period_name)
			row.push(changeTwoDecimal(x.ai_score) || 0);
			row.push(x.ai_grade || '');
			row.push(x.ai_forced_distribution_grade || '');
			row.push(x.performance_rank)

			conf.rows.push(row);
		});

		var result = excel_maker.execute(conf);
		var fname = encodeURIComponent('绩效汇总查询表.xlsx')
		res.setHeader('Content-Type', 'application/vnd.openxmlformats');
		res.setHeader("Content-Disposition", "attachment; filename=" + fname);
		res.end(result, 'binary');

	})
}
var lambda_data4m = function(req, res) {
	var i18n = req.i18n;
	var client = req.user.client.id;
	async.waterfall([

		function(cb) {
			TalentLambda.find({
				client: client,
				is_save: true
			}).exec(cb)
		},
		function(talent, cb) {
			People
				.find({
					client: client,
					employee_status: {
						$in: ['P', 'H']
					},
				})
				.select('_id')
				.sort({
					'people_no': 1
				})
				.exec(function(err, people) {
					if (err) {
						cb(err, null);
					} else {
						var ret = _.map(people, function(x) {
							var found = _.map(talent, function(p) {
								var people_arr = [];
								_.each(p.lambda_data, function(temp) {
									people_arr.push(String(temp.people))
								})
								var obj = {};
								if ( !! ~people_arr.indexOf(String(x._id))) {
									var lambda_temp = _.find(p.lambda_data, function(temp) {
										return temp.people == String(x._id)
									})
									obj.lambda_name = p.lambda_name;
									obj.lambda_period = p.lambda_period;
									obj.ai_score = lambda_temp.ai_score;
									obj.score = lambda_temp.score;
									obj.total_score = lambda_temp.total_score;
									obj.rank = lambda_temp.rank;
									obj.horoscope = lambda_temp.horoscope;
									// obj.horoscope_id = lambda_temp.horoscope_id;
									return obj;
								}

							})
							found = _.compact(found)
							var tmp = x.toJSON();
							if (found) {
								tmp.lambda_data = found;
								tmp.people_id = x._id;
								delete tmp._id;
							}
							return tmp;
						})

						cb(null, ret);
					};
				})

		}
	], function(err, result) {
		if (err) {
			res.status(500);
			res.send({
				code: 'ERR',
				msg: err
			})
		} else {
			res.send(result);
		};
	})

}
var horoscope4m = function(req, res) {
	var i18n = req.i18n;
	var client = req.user.client.id;
	HoroScope.find({
		client: client
	}).exec(function(err, result) {
		if (err) {
			res.status(500);
			res.send({
				code: 'ERR',
				msg: err
			})
		} else {
			res.send(result);
		};
	})
}
module.exports = function(app, checkAuth) {
	var __base_path = '/user/report';
	app.get(__base_path + '/emp_performance', checkAuth, emp_performance);
	app.post(__base_path + '/emp_performance_json', checkAuth, emp_performance_json);
	app.get(__base_path + '/emp_performance_graph', checkAuth, emp_performance_graph);
	app.post(__base_path + '/emp_performance_graph_json', checkAuth, emp_performance_graph_json);
	app.get(__base_path + '/emp_performance_tendency', checkAuth, emp_performance_tendency);
	app.post(__base_path + '/emp_performance_tendency_json', checkAuth, emp_performance_tendency_json);
	app.get(__base_path + '/emp_performance_tendency_ct', checkAuth, emp_performance_tendency_ct);
	app.post(__base_path + '/emp_performance_tendency_ct_json', checkAuth, emp_performance_tendency_ct_json);
	app.get(__base_path + '/emp_performance_score_tendency', checkAuth, emp_performance_score_tendency);
	app.post(__base_path + '/emp_performance_score_tendency_json', checkAuth, emp_performance_score_tendency_json);
	app.get(__base_path + '/emp_performance_score_histogram', checkAuth, emp_performance_score_histogram);
	app.post(__base_path + '/emp_performance_score_histogram_json', checkAuth, emp_performance_score_histogram_json);

	app.get(__base_path + '/emps_performance_score_histogram', checkAuth, emps_performance_score_histogram);
	app.post(__base_path + '/emps_performance_score_histogram_json', checkAuth, emps_performance_score_histogram_json);

	app.get(__base_path + '/emp_performance_index_histogram', checkAuth, emp_performance_index_histogram);
	app.post(__base_path + '/emp_performance_index_histogram_json', checkAuth, emp_performance_index_histogram_json);

	app.get(__base_path + '/emps_performance_index_histogram', checkAuth, emps_performance_index_histogram);
	app.post(__base_path + '/emps_performance_index_histogram_json', checkAuth, emps_performance_index_histogram_json);

	app.get(__base_path + '/emp_performance_score_bubble', checkAuth, emp_performance_score_bubble);
	app.post(__base_path + '/emp_performance_score_bubble_json', checkAuth, emp_performance_score_bubble_json);

	app.get(__base_path + '/emp_performance_score_scatter', checkAuth, emp_performance_score_scatter);
	app.post(__base_path + '/emp_performance_score_scatter_json', checkAuth, emp_performance_score_scatter_json);
	app.get(__base_path + '/emps_performance_index_accounting', checkAuth, emps_performance_index_accounting);
	app.post(__base_path + '/emps_performance_index_accounting_json', checkAuth, emps_performance_index_accounting_json);

	app.get(__base_path + '/emp_performance_index_contrast', checkAuth, emp_performance_index_contrast);
	app.post(__base_path + '/emp_performance_index_contrast_json', checkAuth, emp_performance_index_contrast_json);
	//箱线趋势
	app.get(__base_path + '/emps_performance_index_boxplot', checkAuth, emps_performance_index_boxplot);
	app.post(__base_path + '/emps_performance_index_boxplot_json', checkAuth, emps_performance_index_boxplot_json);
	//箱线对比
	app.get(__base_path + '/emp_performance_index_boxplot', checkAuth, emp_performance_index_boxplot);
	app.post(__base_path + '/emp_performance_index_boxplot_json', checkAuth, emp_performance_index_boxplot_json);

	app.get(__base_path + '/emp_performance_funnel', checkAuth, emp_performance_funnel);
	app.post(__base_path + '/emp_performance_funnel_json', checkAuth, emp_performance_funnel_json);
	//权限得分对比
	app.get(__base_path + '/emp_performance_competence', checkAuth, emp_performance_competence);
	app.post(__base_path + '/emp_performance_competence_json', checkAuth, emp_performance_competence_json);
	//权限得分趋势
	app.get(__base_path + '/emps_performance_competence', checkAuth, emps_performance_competence);
	app.post(__base_path + '/emps_performance_competence_json', checkAuth, emps_performance_competence_json);
	//目标得分和绩效得分的散点图
	app.get(__base_path + '/emp_performance_object_scatter', checkAuth, emp_performance_object_scatter);
	app.post(__base_path + '/emp_performance_object_scatter_json', checkAuth, emp_performance_object_scatter_json);
	//绩效仪表盘
	app.get(__base_path + '/charts', checkAuth, charts);

	//绩效报表用
	app.get(__base_path + '/input_help_emps', checkAuth, input_help_emps)
	//获取但前公司权限
	app.get(__base_path + '/get_company', checkAuth, get_company)
	//员工目标得分
	app.get(__base_path + '/pep_performance_object_score_histogram', checkAuth, pep_performance_object_score_histogram);
	app.post(__base_path + '/pep_performance_object_score_histogram_json', checkAuth, pep_performance_object_score_histogram_json);
	app.get(__base_path + '/pep_performance_object_score_tendency', checkAuth, pep_performance_object_score_tendency);
	app.post(__base_path + '/pep_performance_object_score_tendency_json', checkAuth, pep_performance_object_score_tendency_json);
	//我的绩效列表  个人绩效历史查询表
	//人才九宫图定义
	app.get(__base_path + '/emp_myperformance', checkAuth, emp_myperformance)
	app.get(__base_path + '/horoscope', checkAuth, horoscope_config)
	app.put(__base_path + '/horoscope/:up_id', checkAuth, horoscope_update)
	app.get(__base_path + '/horoscope/:up_id', checkAuth, horoscope_fetch)
	app.get(__base_path + '/horoscope_bb', checkAuth, horoscope_list)
	//人才九宫图分析
	app.get(__base_path + '/360_performance_scatter', checkAuth, performance_360_scatter);
	app.post(__base_path + '/360_performance_scatter_json', checkAuth, performance_360_scatter_json);
	//人才九宫图分析
	app.get(__base_path + '/360_performance_tendency', checkAuth, performance_360_tendency);
	app.post(__base_path + '/360_performance_tendency_json', checkAuth, performance_360_tendency_json);
	//人才管理
	app.get(__base_path + '/talent', checkAuth, talent_manage_list)
	app.get(__base_path + '/input_help_peps', checkAuth, input_help_peps)
	app.get(__base_path + '/people_help_json', checkAuth, people_help_json);
	app.get(__base_path + '/position_help_json', checkAuth, position_help_json);

	//人才盘点
	app.get(__base_path + '/lambda', checkAuth, talent_lambda_bbform)
	app.get(__base_path + '/lambda_list', checkAuth, talent_lambda_bb_list)
	app.get(__base_path + '/lambda_bb', checkAuth, talent_lambda_bb); //表单
	app.get(__base_path + '/lambda_bb/:up_id', checkAuth, talent_lambda_fetch); //获取
	app.post(__base_path + '/lambda_bb/:up_id', checkAuth, talent_lambda_create); //新建的保存
	app.put(__base_path + '/lambda_bb/:up_id', checkAuth, talent_lambda_update); //更新的保存
	app.delete(__base_path + '/lambda_bb/:up_id', checkAuth, talent_lambda_delete); //删除
	//talent_lambda data
	app.post(__base_path + '/talent_lambda_json', checkAuth, talent_lambda_json);
	app.get(__base_path + '/input_help_360', checkAuth, input_help_360);
	app.get(__base_path + '/input_help360', checkAuth, period_inputhelp360);

	app.get(__base_path + '/input_help_lambda', checkAuth, input_help_lambda)
	//人才分布-九宫图
	app.get(__base_path + '/talent_scatter', checkAuth, talent_scatter)
	app.get(__base_path + '/input_help_lambda_list', checkAuth, input_help_lambda_list);
	app.get(__base_path + '/talent_pool', checkAuth, talent_pool_list);
	app.get(__base_path + '/talent_pool_json', checkAuth, talent_pool_json);
	app.get(__base_path + '/pool_bb', checkAuth, talent_pool_fetch); //表单
	//邮件发送
	app.post(__base_path + '/remind', checkAuth, talent_pool_remind); //表单

	// app.get(__base_path + '/pool_bb/:up_id', checkAuth, talent_pool_fetch);
	//绩效汇总导出
	app.get(__base_path + '/performance_download_json', checkAuth, performance_download_json)
	//移动版本相关
	app.get(__base_path + '/lambda_data4m', checkAuth, lambda_data4m);
	app.get(__base_path + '/horoscope4m', checkAuth, horoscope4m);

}
