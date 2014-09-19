printf = require('sprintf').sprintf;
var PayrollPeopleInstance = require('../../models/payroll').PayrollPeopleInstance;
var People = require('../../models/people').People;
var PayrollItemClient = require('../../models/payroll').PayrollItemClient;
var DeductionWages = require('../../models/payroll').DeductionWages;
var DeductionRate = require('../../models/payroll').DeductionRate;
var PayrollPeople = require('../../models/payroll').PayrollPeople;
var Company = require('../../models/structure').Company;

var Client = require('../../models/client').Client;
var us = require('underscore');
var async = require('async');
var fs = require('fs');
var path = require('path');
var exec = require('child_process').exec;
var moment = require('moment')



//运行python脚本的命令行： python zsexcel.py <excel file> <step>
var cmd_excel = [
	'python',
	fs.realpathSync(__dirname + '/../../tools/excel2json.py'),
]

var temp_file_excel = fs.realpathSync(__dirname + '/../../tools/excel2json.json');

var excel_json = function(req, res) {
	var i18n = req.i18n;
	var client = req.user.client.id;
	async.series({
		importdata: function(cb) {
			import_data(req, res, function(data) {
				cb(null, data);
			})
		},
		update_data: function(cb) {
			get_deductionwagesToPeople_update(req, res, function(data) {
				cb(null, data)
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
				success: result.importdata,
				code: 'OK',
				// msg: '人员薪资表提成工资项更新成功！',

			});
		} else {
			return res.json({
				code: 'ERR',
				// msg: '人员薪资表提成工资项更新失败！请导入有效期间数据!'
			});
		};
	})


}

	function import_data(req, res, cb) {
		var client = req.user.client.id;
		var import_file = req.files.qqfile.path;

		ccmd = [cmd_excel.join(' '), import_file, temp_file_excel].join(' '); //第四步
		// 调用python脚本来解析excel
		exec(ccmd, function(err, stdout, stderr) {
			// console.log(err, stdout, stderr);
			fs.unlinkSync(import_file); //解析完删掉
			if (err) {
				// return res.send({
				// 	'error': err
				// });
				cb(err)
			};
			ret = JSON.parse(fs.readFileSync(temp_file_excel, "utf-8"));
			if (ret.code == 'OK') {
				var data_objs = ret.data.worksheets;
				async.waterfall([

					function(cb) {
						async.parallel({
							pis: function(cb) {
								PayrollItemClient.find({
									client: client
								}).exec(function(err, pays) {
									var tems = [];
									var tems2 = [];
									us.each(pays, function(pay) {
										tems.push(pay._id);
										tems2.push(pay.pri_name)
									})
									var pay_obj = us.object(tems2, tems)
									cb(null, pay_obj)
								});
							},
							pr: function(cb) {
								DeductionRate.find({
									client: client
								}).populate('pri').exec(function(err, prs) {
									var temp1 = [];
									var temp2 = [];
									us.each(prs, function(pr) {
										temp1.push(pr._id);
										temp2.push(pr.pri.pri_name)
									})
									var pr_obj = us.object(temp2, temp1)
									cb(null, pr_obj)
								})
							},
							pps: function(cb) {
								People.find({
									client: client,
									block: false,
								}).exec(function(err, pps) {
									var tems3 = [];
									var tems4 = [];
									us.each(pps, function(pp) {
										tems3.push(pp._id);
										tems4.push(pp.people_no)
									})
									var pps_obj = us.object(tems4, tems3)
									cb(null, pps_obj)
								})
							}
						}, cb);
					},
					function(objs, cb) {
						var pis_obj = objs.pis;
						var pps_obj = objs.pps;
						var pr_obj = objs.pr;
						async.times(data_objs.length, function(n, next) {
							//get the sheet name
							var sheet_name = data_objs[n].ws_name;
							//get the col/row data
							var col_row_data = data_objs[n].data;
							var filter_row_datas = us.filter(col_row_data, function(rows) {
								return rows.row == 1;
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
									var pieceworks_data = {}
									pieceworks_data.name = key;
									pieceworks_data.amount = pp_objs[key];
									val.push(pieceworks_data);
								}
								var data = {};
								data.people_id = pps_obj[val[0].amount];
								// get the attendance_data_collection data record;data is a array.
								data.items = [];
								// console.log(val.length);
								async.times(val.length - 4, function(n, next) {
									var temp = val[2];
									var temp1 = val[3];
									var temp2 = val[4];
									var object = {};
									if (temp) {
										object.pri = pis_obj[sheet_name];
										object.pieces = temp.amount;
										object.pay_start = temp1.amount;
										object.pay_end = temp2.amount

									}
									next(null, object)
								}, function(err, item_datas) {
									var pri, pieces, pay_start, pay_end;
									us.each(item_datas, function(temp) {
										pri = temp.pri;
										pieces = temp.pieces;
										pay_start = temp.pay_start;
										pay_end = temp.pay_end
									})
									DeductionWages.findOne({
										client: client,
										people: data.people_id,
										start: pay_start,
										end: pay_end
									}, function(err, pw) {
										if (err) {
											return next(err, null)
										}
										if (pw) {
											pw.pieces = pieces ? pieces : 0;
											pw.start = pay_start;
											pw.end = pay_end;
											pw.save(next)
										} else {
											next(null, null)
										}

									})
									// var createdata = {
									// 	client: client,
									// 	people: data.people_id,
									// 	pri: pri,
									// 	pieces: pieces,
									// 	pr: pr,
									// 	start: pay_start,
									// 	end: pay_end,
									// };
									// DeductionWages.create(createdata, next)
								})
							}, next)
						}, cb)
					}


				], function(err, results) {
					cb(results)

				})


			} else {
				cb(null)
				// return res.send({
				// 	'error': '读取excel失败'
				// });
			};
			// cb(stdout)
		});
	}

	function get_deductionwagesToPeople_update(req, res, cb) {
		var client = req.user.client.id;
		async.waterfall([

				function(cb) {
					Client.findById(
						client
					).exec(cb)
				},
				function(results, cb) {
					var pay_start_date = results.config.payroll.pay_start_date
					var date = moment(new Date()).format('YYYY-MM');

					var validFrom = moment(date).subtract('months', 1).format('YYYY-MM-DD');
					validFrom = moment(validFrom).add('day', parseInt(pay_start_date) - 1).format('YYYY-MM-DD');

					var validTo = moment(validFrom).add('months', 1).format('YYYY-MM-DD');
					validTo = moment(validTo).subtract('day', 1).format('YYYY-MM-DD');
					// var validTo = moment(date).add('day', pay_start_date - 1).format('YYYY-MM-DD');
					// var validFrom = moment(validTo).subtract('months', 1).format('YYYY-MM-DD');
					DeductionWages.find({
						client: client,
						start: validFrom,
						end: validTo
					}).populate('pr').exec(function(err, resultss) {
						cb(null, resultss)
					})
				},
				function(result, cb) {
					if (result) {
						var pep = [];
						var piece = [];
						us.each(result, function(temp) {
							pep.push(temp.people)
							piece.push(temp.pieces);
						})
						var pep_piece = us.object(pep, piece);
						async.times(result.length, function(n, next) {
							var pw = result[n];

							var ss = [];
							// var liner = {};
							if (pw.pr) {
								us.each(pw.pr.subsection, function(temp) {
									// liner.a = temp.a;
									// liner.b = temp.b;
									var rate = [];
									rate.push(temp.r1);
									rate.push(temp.r2);
									rate.push(temp.a);
									ss.push(us.object(['r1', 'r2', 'a'], rate));

								})
								ss = us.sortBy(ss, function(s) {
									return s.r1
								});
								var func_value = function(x) {
									var real_value = Fun(x, ss)
									return real_value ? real_value : 0;
								}
							} else {
								var func_value = 0
							}

							//这里期间等数据整理后再过滤,这里只是一段测试代码
							PayrollPeople.findOne({
								client: client,
								people: pw.people,

							}).exec(function(err, pep_info) {
								var items = [];
								var temp = {};
								if (pep_info) {
									var piece_item = us.find(pep_info.items, function(temp) {

										return pw.pri == String(temp.pri);
									})
									var piec_num = pep_piece[pep_info.people] ? pep_piece[pep_info.people] : 0;
									var piece_real = func_value(piec_num)
									var piece_wage_value = piece_real ? piece_real : 0;
									var temp_gua_value = pw.gua_value;
									var temp_cap_value = pw.cap_value;
									if (piece_item) {
										piece_item.pri = pw.pri;
										if (temp_cap_value != null) {
											if (piece_wage_value <= temp_cap_value) {
												if (piece_wage_value <= temp_gua_value) {
													piece_item.value = temp_gua_value;
												} else {
													piece_item.value = piece_wage_value;
												}
											} else {
												piece_item.value = temp_cap_value;
											}
										} else {
											piece_item.value = piece_wage_value;
										}
										piece_item.source_type = 'M';
										// console.log(piece_item);
									} else {
										temp.pri = pw.pri;
										if (temp_cap_value != null) {
											if (piece_wage_value <= temp_cap_value) {
												if (piece_wage_value <= temp_gua_value) {
													temp.value = temp_gua_value;

												} else {
													temp.value = piece_wage_value;
												}
											} else {
												temp.value = temp_cap_value;
											}
										} else {
											temp.value = piece_wage_value;
										}
										temp.source_type = 'M';
										pep_info.items.push(temp);
									}

									pep_info.save(next);
								} else {
									next(null, null)
								}
								// console.log(pep_info.items[0])
								// next(null, pep_info);
							})
						}, cb)
					}



				},
			],

			function(err, results) {
				cb(results)
			})
	}
var cmd = [
	'python',
	fs.realpathSync(__dirname + '/../../tools/genexcel.py'),
]
var temp_file = fs.realpathSync(__dirname + '/../../tools/temp.json');

var get_deduction_wages = function(req, res) {
	var company = req.params.company;

	async.series({
		data_json: function(cb) {
			get_json(req, res, function(data) {
				cb(null, data)
			});
		},
		json2excel: function(cb) {
			json2excel(function(data) {
				cb(null, data)
			})

		},
		company: function(cb) {
			Company.findById(company, cb)
		}

	}, function(err, result) {
		var str_url = result.json2excel;
		str_url = str_url.split('\n')
		var fname = encodeURIComponent(result.company.company_name + '(提成数据).xls')

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

		var validTo = moment(validFrom).add('months', 1).format('YYYY-MM-DD');
		validTo = moment(validTo).subtract('day', 1).format('YYYY-MM-DD');
		// var validTo = moment(date).add('day', pay_start_date - 1).format('YYYY-MM-DD');
		// var validFrom = moment(validTo).subtract('months', 1).format('YYYY-MM-DD');
		var target_company = req.params.company;
		async.waterfall([

				function(cb) {
					async.parallel({
						pieces: function(cb) {
							DeductionWages.find({
								client: client
							}).populate('pri').exec(cb)
						},
						peoples: function(cb) {
							async.waterfall([

								function(cb) {
									DeductionWages.find({
										client: client
									}).exec(function(err, pep) {
										var item = [];
										us.each(pep, function(temp) {
											item.push(temp.people)
										})
										cb(null, item)
									})
								},
								function(peoples, cb) {
									People.find({
										client: client,
										block: false,
										_id: {
											$in: peoples
										},
										company: target_company
									}).exec(cb)
								}
							], cb)
						}
					}, cb);
				},
				function(pis, cb) {
					var peps = pis.peoples;
					// var pays = pis.payrollitemclients;
					var piece = pis.pieces;
					// console.log(pays);
					async.times(peps.length, function(n, next) {
						var pep = peps[n];
						var obj = {};
						obj.people_id = pep.id;
						obj.people_no = pep.people_no;
						obj.people_name = pep.firstname + pep.lastname;
						obj.pep_pieceworks = [];
						obj.pep_pieceworks.push('工号');
						obj.pep_pieceworks.push('姓名');
						obj.pep_pieceworks.push('数量');
						// obj.pep_pieceworks.push('提成工资费率区间名称');
						obj.pep_pieceworks.push('开始日期');
						obj.pep_pieceworks.push('结束日期');
						next(null, obj)
					}, function(err, datas) {
						var obj_data = {};
						obj_data.filename = "DeductionWages.xls";
						obj_data.worksheets = [];
						var py = {};
						py.ws_name = piece[0].pri.pri_name;
						py.col_num = '10';
						py.data = [];
						var res_data;
						us.each(datas, function(data) {
							res_data = data.pep_pieceworks;
						})
						py.data.push({
							"row": 0,
							"col": 0,
							"text": peps[0].company_name
						})
						for (var i = 0; i < res_data.length; i++) {
							py.data.push({
								"row": 1,
								"col": i,
								"text": res_data[i]
							})
						};
						for (var i = 0; i < datas.length; i++) {
							py.data.push({
								"row": i + 2,
								"col": 1,
								"text": datas[i].people_name,
							});
							py.data.push({
								"row": i + 2,
								"col": 0,
								"text": datas[i].people_no,
							});
							py.data.push({
								"row": i + 2,
								"col": 3,
								"text": validFrom,
							});
							py.data.push({
								"row": i + 2,
								"col": 4,
								"text": validTo,
							});

						};
						obj_data.worksheets.push(py);


						cb(null, obj_data)
					})
				},
				function(obj_data, cb) {
					fs.writeFile('./tools/temp.json', JSON.stringify(obj_data), 'utf-8', function(err) {
						if (err) {
							return res.send({
								'error': err
							});
						};
					})
					cb(null, obj_data)
				}
			], function(err, result) {
				cb(result)
			}

		)

	}

	function json2excel(cb) {
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



var Fun = function(x, ss) {
	var st = us.filter(ss, function(s) {
		return (x >= s.r1);
	})
	//console.log(st);
	// console.log(s);
	if (st) {
		var xr = [];
		us.each(st, function(s) {
			if (x > s.r2) {
				xr.push({
					x: s.r2 - s.r1,
					a: s.a,
				});
			} else {
				xr.push({
					x: x - s.r1,
					a: s.a,
				});
			};
		})

		x = us.reduce(xr, function(memo, x) {

			return FunLiner(x.x, x.a) + memo;

		}, 0);


		// console.log(x);
	} else {
		x = null; //没找到落的区间，x设置为null。
	};
	return x;
}
var FunLiner = function(x, a) { //线性函数
	return a * x;
};
module.exports = function(app, checkAuth) {
	var __base_path = '/admin/lsmw';
	app.post(__base_path + '/s008', checkAuth, excel_json);
	app.get(__base_path + '/get_deduction_wages/:company', checkAuth, get_deduction_wages);
	app.get(__base_path + '/get_deductionwagesToPeople_update', checkAuth, get_deductionwagesToPeople_update)
}
                                                data_collection 2 by @ Ivan
