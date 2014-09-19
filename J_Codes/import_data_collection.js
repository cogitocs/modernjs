printf = require('sprintf').sprintf;
var PayrollPeopleInstance = require('../../models/payroll').PayrollPeopleInstance;
var People = require('../../models/people').People;
var PayrollItemClient = require('../../models/payroll').PayrollItemClient;
var PayrollPeople = require('../../models/payroll').PayrollPeople;
var ImportDataCollection = require('../../models/payroll').ImportDataCollection;
var Client = require('../../models/client').Client;
var Company = require('../../models/structure').Company;

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
			get_template_data_update(req, res, function(data) {
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
				code: 'OK',
				'success': result.importdata,
				// msg: '人员薪资表行政处罚扣款项更新成功！',
			});
		} else {
			return res.json({
				code: 'ERR',
				// msg: '人员薪资表行政处罚扣款项更新失败！请导入有效期间数据！'
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
			fs.unlinkSync(import_file); //解析完删掉
			if (err) {
				cb(err)
				// return res.send({
				// 	'error': err
				// });
			};
			ret = JSON.parse(fs.readFileSync(temp_file_excel, "utf-8"));
			//fs.unlinkSync(temp_file); //解析完删掉
			// console.log(ret);
			if (ret.code == 'OK') {
				var data_objs = ret.data.worksheets;
				// console.log(data_objs);
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
									var template_data = {}
									template_data.name = key;
									template_data.amount = pp_objs[key];
									val.push(template_data);
								}
								var data = {};
								data.people_id = pps_obj[val[0].amount];
								// get the attendance_data_collection data record;data is a array.
								data.items = [];
								async.times(val.length - 4, function(n, next) {
									var temp = val[2];
									var temp1 = val[3];
									var temp2 = val[4];
									var object = {};
									if (temp) {
										// object.pri = pis_obj[temp.name];
										object.pri = pis_obj[sheet_name];
										object.amount = temp.amount;
										object.pay_start = temp1.amount;
										object.pay_end = temp2.amount

									}
									next(null, object)
								}, function(err, item_datas) {
									var pri, amount, pay_start, pay_end;
									us.each(item_datas, function(temp) {
										pri = temp.pri;
										amount = temp.amount;
										pay_start = temp.pay_start;
										pay_end = temp.pay_end;
									})
									var createdata = {
										client: client,
										people: data.people_id,
										pri: pri,
										amount: amount,
										pay_start: pay_start,
										pay_end: pay_end
									};
									ImportDataCollection.findOne({
										client: client,
										pri: pri,
										people: data.people_id,
										pay_start: pay_start,
										pay_end: pay_end
									}, function(err, pw) {
										if (err) {
											return next(err, null)
										}
										if (pw) {
											pw.amount = parseFloat(amount).toFixed(2);
											pw.save(next)
										} else {
											ImportDataCollection.create(createdata, next)
										}
									})
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
		});
	}

	function get_template_data_update(req, res, cb) {
		var pri_id = req.params.pri_name
		var client = req.user.client.id;
		async.waterfall([

				function(cb) {
					Client.findById(
						client
					).exec(cb)
				},
				function(results, cb) {
					var pay_start_date = results.config.payroll.pay_start_date;
					var date = moment(new Date()).format('YYYY-MM');

					var validFrom = moment(date).subtract('months', 1).format('YYYY-MM-DD');
					validFrom = moment(validFrom).add('day', parseInt(pay_start_date) - 1).format('YYYY-MM-DD');

					var validTo = moment(validFrom).add('months', 1).format('YYYY-MM-DD');
					validTo = moment(validTo).subtract('day', 1).format('YYYY-MM-DD');
					// var validTo = moment(date).add('day', pay_start_date - 1).format('YYYY-MM-DD');
					// var validFrom = moment(validTo).subtract('months', 1).format('YYYY-MM-DD');
					ImportDataCollection.find({
						client: client,
						pri: pri_id,
						pay_start: validFrom,
						pay_end: validTo
					}).exec(function(err, result) {
						cb(null, result)
					})

				},
				function(result, cb) {
					var pep = [];
					var amount = [];
					us.each(result, function(temp) {
						pep.push(temp.people)
						amount.push(temp.amount);
						// amount.push(amout.amount);

					})
					var pep_amount = us.object(pep, amount);
					async.times(result.length, function(n, next) {
						var pa = result[n];
						//这里期间等数据整理后再过滤,这里只是一段测试代码
						PayrollPeople.findOne({
							client: client,
							people: pa.people,

						}).exec(function(err, pep_info) {
							// console.log(pa.data[0].pri);
							if (err) {
								req.app.locals.handle500(err, req, res);
							};
							var items = [];
							var temp = {};
							if (pep_info) {
								var pep_item = us.find(pep_info.items, function(temp) {

									return pa.pri == String(temp.pri);
								})
								// console.log(pep_amount[pep_info.people]);
								if (pep_item) {
									pep_item.pri = pa.pri;
									pep_item.value = pep_amount[pep_info.people] ? pep_amount[pep_info.people] : 0;
									pep_item.source_type = 'M'
								} else {
									temp.pri = pa.pri;
									temp.value = pep_amount[pep_info.people] ? pep_amount[pep_info.people] : 0;
									temp.source_type = 'M';
									pep_info.items.push(temp);

								}
								pep_info.save(next);
							}


						})
					}, cb)



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

var get_template = function(req, res) {
	var company = req.params.company;
	var pri_id = req.params.pri_name;
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
		},
		pri_name: function(cb) {
			PayrollItemClient.findById(pri_id, cb)
		}

	}, function(err, result) {
		var str_url = result.json2excel;
		str_url = str_url.split('\n')
		var fname = encodeURIComponent(result.company.company_name + '(' + result.pri_name.pri_name + '数据).xls')
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
		var pri_id = req.params.pri_name;

		async.waterfall([

				function(cb) {
					async.parallel({
						payrollitemclients: function(cb) {
							PayrollItemClient.find({
								client: client,
								_id: pri_id
							}).populate('pris.pri').exec(cb);
						},
						peoples: function(cb) {
							async.waterfall([

								function(cb) {
									PayrollPeople.find({
										client: client
									}).populate('payroll_package').exec(function(err, result) {
										var filter_data = us.filter(result, function(temp) {
											return !!~temp.payroll_package.pris.indexOf(pri_id)
										})
										var item = [];
										us.each(filter_data, function(temp) {
											item.push(temp.people)
										})
										cb(null, item)
									})
								},
								function(pep, cb) {
									People.find({
										client: client,
										block: false,
										_id: {
											$in: pep
										},
										company: target_company
									}).exec(cb)
								}
							], cb)

						},
						// admin: function(cb) {
						// 	AdministrativeDeductionDataCollection.find({
						// 		client: client
						// 	}).populate('data.pri').exec(cb)
						// }
					}, cb);
				},
				function(pis, cb) {
					var peps = pis.peoples;
					var pays = pis.payrollitemclients;
					// var admin = pis.admin[0].data;
					// console.log(pays);
					if (peps.length > 0) {
						async.times(peps.length, function(n, next) {
							var pep = peps[n];
							var obj = {};
							obj.people_id = pep.id;
							obj.people_no = pep.people_no;
							obj.people_name = pep.firstname + pep.lastname;
							obj.template_data = [];
							obj.template_data.push('工号');
							obj.template_data.push('姓名');
							// obj.template_data.push(admin[0].pri.pri_name);
							obj.template_data.push(pays[0].pri_name);
							obj.template_data.push('开始日期');
							obj.template_data.push('结束日期');
							next(null, obj)
						}, function(err, datas) {
							var obj_data = {};
							obj_data.filename = "temp.xls";
							obj_data.worksheets = [];
							var py = {};
							// py.ws_name = admin[0].pri.pri_name;
							py.ws_name = pays[0].pri_name;

							py.col_num = '10';
							py.data = [];
							var res_data;
							us.each(datas, function(data) {
								res_data = data.template_data;
							})
							py.data.push({
								"row": 0,
								"col": 0,
								"text": peps[0] ? peps[0].company_name : '薪酬方案中无此适用的工资项，请重新选择！！!'
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
					} else {
						var obj_data = {};
						obj_data.filename = "temp.xls";
						obj_data.worksheets = [];
						var py = {};
						py.ws_name = pays[0].pri_name;

						py.col_num = '10';
						py.data = [];
						py.data.push({
							"row": 0,
							"col": 0,
							"text": peps[0] ? peps[0].company_name : '薪酬方案中无此适用的工资项，请重新选择！！!'
						})
						obj_data.worksheets.push(py);
						cb(null, obj_data)
					}

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



module.exports = function(app, checkAuth) {
	var __base_path = '/admin/lsmw';
	app.post(__base_path + '/s009/:pri_name', checkAuth, excel_json);
	app.get(__base_path + '/get_template/:company/:pri_name', checkAuth, get_template);
	app.get(__base_path + '/get_template_data_update', checkAuth, get_template_data_update)
}

                                                 data collection @by Ivan
