var otblTaskItems;
Handlebars.registerHelper('toISODate', function(date) {
    return moment(date).format('YYYY-MM-DD');
});
Handlebars.registerHelper('calcSize', function(data) {
    return calcSize(data);
});
Handlebars.registerHelper('span', function(plan_s, plan_e) {
    if (moment(plan_s).isBefore(new Date()) && moment(plan_e).isAfter(new Date())) {
        return '<span class="label label-success">进行中</span>'
    } else if (moment(plan_s).isAfter(new Date())) {
        return '<span class="label label-success">未开始</span>'
    } else {
        return '<span class="label label-success">已结束</span>'
    }
});
Handlebars.registerHelper('pass', function(id, pass, plan_s, plan_e) {
    if (pass) {
        return '<input data-up_id="'+id+'" id="pass' + id + '" style="align:center" type="checkbox" checked></input>'
    } else {
        if (moment(plan_s).isBefore(new Date()) && moment(plan_e).isBefore(new Date())) {
            return '<input data-up_id="'+id+'" id="pass' + id + '" style="align:center" type="checkbox"></input>'
        }
    }

});
Handlebars.registerHelper('opt_ret', function(develope_type, type_data) {
    var item = [];
    if (develope_type) {
        var type_temp = _.find(type_data, function(temp) {
            return temp._id == String(develope_type)
        })
        _.each(type_data, function(temp) {
            var temp_arr = [];
            temp_arr.push(temp._id);
            temp_arr.push(temp.type_name)
            if (temp._id == String(develope_type)) {

                item.push('<option value="' + temp_arr + '" selected>' + temp.type_name + '</option>')

            } else {
                item.push('<option value="' + temp_arr + '" >' + temp.type_name + '</option>')

            }
        })
        // item.push('<option value="' + type_temp._id + '" >' + type_temp.type_name + '</option>')

    } else {
        item.push('<option>请选择培养方式</option>')
        _.each(type_data, function(temp) {
            var temp_arr = [];
            temp_arr.push(temp._id);
            temp_arr.push(temp.type_name)
            item.push('<option data-name="' + temp.type_name + '" value="' + temp_arr + '" >' + temp.type_name + '</option>')
        })
    }
    return item.join('');
});
Handlebars.registerHelper('opt_style_ret', function(develope_type, style_id, type_data) {
    var item = [];
    if (develope_type) {
        var type_temp = _.find(type_data, function(temp) {
            return temp._id == String(develope_type)
        })
        if (style_id) {
            var style_temp = _.find(type_temp.develope_style, function(temp) {
                return temp._id == String(style_id)
            })
            var temp_arr = [];
            temp_arr.push(style_temp._id);
            temp_arr.push(style_temp.style_name)
            _.each(type_temp.develope_style, function(temp) {
                var temp_arr = [];
                temp_arr.push(temp._id);
                temp_arr.push(temp.style_name)
                if (temp._id == String(style_id)) {
                    item.push('<option value="' + temp_arr + '" selected>' + style_temp.style_name + '</option>')

                } else {
                    item.push('<option value="' + temp_arr + '" >' + temp.style_name + '</option>')

                }
            })

        } else {
            item.push('<option>请选择培养手段</option>')

            _.each(type_temp.develope_style, function(temp) {
                var temp_arr = [];
                temp_arr.push(temp._id);
                temp_arr.push(temp.style_name)
                item.push('<option value="' + temp_arr + '" >' + temp.style_name + '</option>')
            })
        }


    }
    return item.join('');
});
Handlebars.registerHelper('opt_learn_ret', function(develope_type, style_id, learn_style, type_data) {
    var item = [];
    if (develope_type && style_id) {
        var type_temp = _.find(type_data, function(temp) {
            return temp._id == String(develope_type)
        })
        var style_temp = _.find(type_temp.develope_style, function(temp) {
            return temp._id == String(style_id)
        })
        var obj = {};
        _.each(learn.models, function(temp) {
            obj[temp.attributes._id] = temp.attributes.type_name
        })
        if (learn_style) {
            var learn_temp = _.find(style_temp.learn_style, function(temp) {
                return temp == String(learn_style)
            })
            _.each(style_temp.learn_style, function(temp) {
                var temp_arr = [];
                temp_arr.push(temp);
                temp_arr.push(obj[temp])
                if (learn_style == String(temp)) {
                    item.push('<option value="' + temp_arr + '" selected>' + obj[temp] + '</option>')

                } else {
                    item.push('<option value="' + temp_arr + '">' + obj[temp] + '</option>')
                }

            })
        } else {
            item.push('<option>请选择培养安排方式</option>')
            _.each(style_temp.learn_style, function(temp) {
                var temp_arr = [];
                temp_arr.push(temp);
                temp_arr.push(obj[temp])
                item.push('<option value="' + temp_arr + '" >' + obj[temp] + '</option>')
            })
        }


    }
    return item.join('');
});
Handlebars.registerHelper('opt_check_ret', function(develope_type, style_id, check_style, type_data) {
    var item = [];
    if (develope_type && style_id) {
        var type_temp = _.find(type_data, function(temp) {
            return temp._id == String(develope_type)
        })
        var style_temp = _.find(type_temp.develope_style, function(temp) {
            return temp._id == String(style_id)
        })
        var obj = {};
        _.each(check.models, function(temp) {
            obj[temp.attributes._id] = temp.attributes.type_name
        })
        if (check_style) {
            var check_temp = _.find(style_temp.check_style, function(temp) {
                return temp == String(check_style)
            })
            _.each(style_temp.check_style, function(temp) {
                var temp_arr = [];
                temp_arr.push(temp);
                temp_arr.push(obj[temp])
                if (check_style == String(temp)) {
                    item.push('<option value="' + temp_arr + '" selected>' + obj[temp] + '</option>')

                } else {
                    item.push('<option value="' + temp_arr + '">' + obj[temp] + '</option>')
                }

            })
        } else {
            item.push('<option>请选择成果评估方式</option>')
            _.each(style_temp.check_style, function(temp) {
                var temp_arr = [];
                temp_arr.push(temp);
                temp_arr.push(obj[temp])
                item.push('<option value="' + temp_arr + '" >' + obj[temp] + '</option>')
            })
        }


    }
    return item.join('');
});
var Plan = Backbone.Model.extend({
    idAttribute: "_id",
    rootUrl: '/admin/pm/talent_develope/plan',
    url: function() {
        return this.rootUrl + '/' + this.id;
    },
});
var Type = Backbone.Model.extend({
    idAttribute: "_id",
    rootUrl: '/admin/pm/talent_develope/type_bb',
    url: function() {
        return this.rootUrl + '/' + this.id;
    },
});
var Learn = Backbone.Model.extend({
    idAttribute: "_id",
    rootUrl: '/admin/pm/talent_develope/learn_bb',
    url: function() {
        return this.rootUrl + '/' + this.id;
    },
});
var Check = Backbone.Model.extend({
    idAttribute: "_id",
    rootUrl: '/admin/pm/talent_develope/check_bb',
    url: function() {
        return this.rootUrl + '/' + this.id;
    },
});
var Types = Backbone.Collection.extend({
    model: Type,
    url: '/admin/pm/talent_develope/type_bb',
});
var Learns = Backbone.Collection.extend({
    model: Learn,
    url: '/admin/pm/talent_develope/learn_bb',
});
var Checks = Backbone.Collection.extend({
    model: Check,
    url: '/admin/pm/talent_develope/check_bb',
});
var Plans = Backbone.Collection.extend({
    model: Plan,
    url: '/admin/pm/talent_develope/plan',
});
var PlanView = Backbone.View.extend({
    el: '#view_plan',
    template: Handlebars.compile($("#tmp_plan").html()),
    render: function() {
        var self = this;
        var type_data = _.map(type.models, function(temp) {
            return temp.attributes
        })
        var learn_data = _.map(learn.models, function(temp) {
            return temp.attributes
        })
        var check_data = _.map(check.models, function(temp) {
            return temp.attributes
        })
        console.log(self);
        var rendered_data = _.map(plan.models[0].attributes.plan_divide, function(x) {
            x.type_data = type_data
            return self.template(x)
        })
        this.$el.html(rendered_data.join(''));
        return this;
    },
})
var AttachmentsView = Backbone.View.extend({
    el: '#view_attachments',
    template: Handlebars.compile($("#tmp_attachments_table").html()),
    render: function() {
        this.$el.html(this.template(plan.models[0].attributes));
        return this;
    },
})
var plan = new Plans();
var type = new Types();
var learn = new Learns();
var check = new Checks();
var plan_view = new PlanView({
    model: plan
})
var attachment_view = new AttachmentsView({
    model: plan
})
$(document).ready(function() {
    $("#direct").attr("disabled", true)
    $("#des_car").attr("disabled", true)
    $("#des_pos").attr("disabled", true)
    fetch_plan();
    async.series({
        type: function(cb) {
            type.fetch().done(function() {
                cb(null, 'OK')
            })
        },
        learn: function(cb) {
            learn.fetch().done(function() {
                cb(null, 'OK')
            })
        },
        check: function(cb) {
            check.fetch().done(function() {
                cb(null, 'OK')
            })
        },
        plan: function(cb) {
            plan.fetch().done(function() {
                cb(null, 'OK')
            })
        },
        // destroy: function(cb) {

        //     cb(null, 'OK')
        // }
    }, function(err, result) {
        if ($.fn.DataTable.fnIsDataTable(document.getElementById('tblTaskItems'))) {
            $('#tblTaskItems').dataTable().fnClearTable();
            $('#tblTaskItems').dataTable().fnDestroy();
        };
        plan_view.render();
        attachment_view.render();
        // init_talbe();

    })
    // plan.on('sync', function() {
    //     if ($.fn.DataTable.fnIsDataTable(document.getElementById('tblTaskItems'))) {
    //         $('#tblTaskItems').dataTable().fnClearTable();
    //         $('#tblTaskItems').dataTable().fnDestroy();
    //     };
    //     init_talbe();

    //     plan_view.render();

    // })
    $("body")
        .on('click', '.chzn-select', function(event) {
            event.preventDefault();
            var up_id = $(this).data("up_id");
            // var plans = plan.models[0].get("plan_divide");
            var plans = plan.models[0].attributes.plan_divide;
            var found = get_data(up_id, plans)
            var field1 = $(this).data("field1")
            var field2 = $(this).data("field2")
            var _id = String($(this).val()).split(',')[0];
            var name = String($(this).val()).split(',')[1]
            if (found) {
                found[field1] = _id;
                found[field2] = name;
                plan.models[0].save(plan.models[0].attributes, {
                    success: function(model, response, options) {
                        show_notify_msg('更改已保存', 'OK');
                        fetch_plan();
                        // plan.trigger('sync')
                        plan_view.render();
                    },
                    error: function(model, xhr, options) {
                        show_notify_msg('人才培养手段名称重复，请重新设定。', 'ERR');
                    }
                });
            }

        })
        .on('click', '.btn_remove', function(event) {
            event.preventDefault();
            var up_id = $(this).data("up_id");
            var plans = plan.models[0].get("plan_divide");
            var found = delete_data(up_id, plans)
            plan.models[0].attributes.plan_divide = found;
            plan.models[0].save(plan.models[0].attributes, {
                success: function(model, response, options) {
                    show_notify_msg('更改已保存', 'OK');
                    fetch_plan();
                    plan_view.render();
                },
                error: function(model, xhr, options) {
                    show_notify_msg('人才培养手段名称重复，请重新设定。', 'ERR');
                }
            });
        })
        .on('change', '#comment', function(event) {
            event.preventDefault();
            var $this = $(this);
            var plans = plan.models[0];
            plans.attributes.comment = $("#comment").val()
            plans.save(plans.attributes, {
                success: function(model, response, options) {
                    show_notify_msg('更改已保存', 'OK');
                },
                error: function(model, xhr, options) {
                    show_notify_msg('更改失败', 'ERR');
                }
            });
        })
        .on('change', 'input[type="checkbox"]', function(event) {
            event.preventDefault();
            var $this = $(this)
            var up_id = $(this).data("up_id");
            var plans = plan.models[0].attributes.plan_divide;
            var found = get_data(up_id, plans)
            if (found) {
                if ($this.attr("checked")) {
                    found.pass = true;
                } else {
                    found.pass = false;
                }
                plan.models[0].save(plan.models[0].attributes, {
                    success: function(model, response, options) {
                        show_notify_msg('更改已保存', 'OK');
                        fetch_plan();
                        // plan.trigger('sync')
                        plan_view.render();
                    },
                    error: function(model, xhr, options) {
                        show_notify_msg('更改失败', 'ERR');
                    }
                });
            }
        })
        .on('change', '#periodFrom', function(event) {
            event.preventDefault();
            var $this = $(this);
            var plans = plan.models[0];
            plans.attributes.period_start = $("#periodFrom").val()
            plans.save(plans.attributes, {
                success: function(model, response, options) {
                    show_notify_msg('更改已保存', 'OK');
                    fetch_plan();
                },
                error: function(model, xhr, options) {
                    show_notify_msg('更改失败', 'ERR');
                }
            });
        })
        .on('change', '#periodTo', function(event) {
            event.preventDefault();
            var $this = $(this);
            var plans = plan.models[0];
            plans.attributes.period_end = $("#periodTo").val()
            plans.save(plans.attributes, {
                success: function(model, response, options) {
                    show_notify_msg('更改已保存', 'OK');
                    fetch_plan();

                },
                error: function(model, xhr, options) {
                    show_notify_msg('更改失败', 'ERR');
                }
            });
        })
    $("#plan_name").on('change', function(event) {
        var $this = $(this);
        var plans = plan.models[0];
        plans.attributes.plan_name = $("#plan_name").val()
        plans.save(plans.attributes, {
            success: function(model, response, options) {
                show_notify_msg('更改已保存', 'OK');
            },
            error: function(model, xhr, options) {
                show_notify_msg('更改失败', 'ERR');
            }
        });
    })
    $("#btn_add_task").on('click', function(event) { //添加新任务－放到任务清单的最下面
        event.preventDefault();
        // var plans =plan.attributes;
        show_notify_msg('正在添加任务...', 'OK');
        var obj = {
            'plan_s': moment(),
            'plan_e': moment(new Date()).add('d',15)
        }
        plan.models[0].attributes.plan_divide.push(obj)
        plan.models[0].save(plan.models[0].attributes, {
            success: function(model, response, options) {
                show_notify_msg('更改已保存', 'OK');
                fetch_plan();
                plan_view.render();
                window.location.reload();
            },
            error: function(model, xhr, options) {
                show_notify_msg('计划添加失败', 'ERR');
            }
        });
        // ap_data.trigger('change');
    });

    $("#tblTaskItems").on('click', '.btn-dp', function(event) {
        event.preventDefault();
        var $this = $(this);
        $this.datepicker({
            format: 'yyyy-mm-dd',
            autoclose: true,
            // clearBtn: true,
            language: i18n.lng()
        }).on('changeDate', function(ev) {
            var up_id = $(this).data("up_id");
            var plans = plan.models[0].attributes.plan_divide;
            var found = get_data(up_id, plans)
            var field = $(this).data("field");
            // var s_date = moment(ev.date).format('yyyy-mm-dd');
            // var periodF = moment($("#periodFrom").val()).format('yyyy-mm-dd')
            // var periodT = moment($("#periodTo").val()).format('yyyy-mm-dd')
            // alert(s_date)
            // alert(periodF)
            if (field == "plan_s") {
                if (moment(ev.date).isBefore($("#periodFrom").val())) {
                    alert('计划分解开始时间需大于计划开始时间')
                } else if (moment(ev.date).isAfter($("#periodTo").val())) {
                    alert('计划分解开始时间需小于于计划束时间')

                } else {
                    found[field] = ev.date;

                }
                plan.models[0].save(plan.models[0].attributes, {
                    success: function(model, response, options) {
                        show_notify_msg('更改已保存', 'OK');
                        fetch_plan();
                        plan_view.render();
                    },
                    error: function(model, xhr, options) {
                        show_notify_msg('更改失败', 'ERR');
                    }
                });
            } else {
                if (moment(ev.date).isAfter($("#periodTo").val())) {
                    alert('计划分解结束时间需小于计划结束时间')
                } else if (moment(ev.date).isBefore($("#periodFrom").val())) {
                    alert('计划分解结束时间需大于计划开始时间')

                } else {
                    found[field] = ev.date;

                }
                plan.models[0].save(plan.models[0].attributes, {
                    success: function(model, response, options) {
                        show_notify_msg('更改已保存', 'OK');
                        fetch_plan();
                        plan_view.render();
                    },
                    error: function(model, xhr, options) {
                        show_notify_msg('更改失败', 'ERR');
                    }
                });
            }


            $this.datepicker('hide');
        });
        $this.datepicker('show');
    });
    // 处理上传附件的功能－初始化上传组件
    var manualuploader = $('#jquery-wrapped-fine-uploader').fineUploader({
        request: {
            endpoint: '/gridfs/put'
        },
        multiple: true,
        autoUpload: false,

        text: {
            uploadButton: '<div><i class="icon-plus icon-white"></i>选择文件</div>',
            dragZone: '将文件拖放到这里进行上传',
        },
        template: '<div class="qq-uploader clearfix">' + '<pre class="qq-upload-drop-area"><span>{dragZoneText}</span></pre>' + '<div class="qq-upload-button btn btn-success">{uploadButtonText}</div>' + '<div class="tips">格式不限</div>' + '<span class="qq-drop-processing"><span>{dropProcessingText}</span>' + '<span class="qq-drop-processing-spinner"></span></span>' + '</div>' + '<div><ul class="qq-upload-list"></ul></div>',

    });
    manualuploader.on('complete', function(event, id, fileName, responseJSON) {
        var attachments = plan.models[0].attributes.attachments;
        var file_ids = responseJSON.success || [];
        _.each(file_ids, function(x) {
            attachments.push({
                file: {
                    _id: x._id,
                },
                people: {
                    _id: $("#login_people").val(),
                }
            });
        })
        plan.models[0].attributes.attachments = attachments;
        plan.models[0].save(plan.models[0].attributes, {
            success: function(model, response, options) {
                show_notify_msg('更改已保存', 'OK');
                window.location.reload();

                fetch_plan();
                attachment_view.render();
            },
            error: function(model, xhr, options) {
                show_notify_msg('计划添加失败', 'ERR');
            }
        });
        // plan.models[0].save();
        // plan.fetch();
        // attachment_view();
        $("#ihModalAttachment").modal('hide');
    })
    $("#view_attachments").on('click', '.btn_remove_attachment', function(event) {
        event.preventDefault();
        if (confirm("确认删除附件吗？")) {
            var attachments = plan.models[0].attributes.attachments;
            var $this = $(this);
            var file_id = $this.data('file_id');
            var found = _.find(attachments, function(x) {
                    return x.file._id == file_id;
                })
                //删除grid fs的数据
            $.post('/gridfs/delete', {
                'file_id': file_id
            }, function(data) {
                show_notify_msg(data.msg, data.code);
                attachments.splice(attachments.indexOf(found), 1); //删除
                plan.models[0].attributes.attachments = attachments;
                plan.models[0].save(plan.models[0].attributes, {
                    success: function(model, response, options) {
                        show_notify_msg('更改已保存', 'OK');
                        fetch_plan();
                        attachment_view.render();
                    },
                    error: function(model, xhr, options) {
                        show_notify_msg('计划添加失败', 'ERR');
                    }
                });
            }).fail(function(err) {
                show_notify_msg(err.status + ' ' + err.statusText, 'ERR');
            }).always(function() {
                hide_ajax_loader_s();
            })
        };
    });
    $('#triggerUpload').click(function() {
        manualuploader.fineUploader('uploadStoredFiles');
    });
    // 处理上传附件的功能－打开对话框
    $("#btn_add_attachment").on('click', function(event) {
        event.preventDefault();
        $("#ihModalAttachment").modal('show');
    });
    $("#periodFrom,#periodTo").datepicker({
        format: 'yyyy-mm-dd',
        autoclose: true
    }).mask('9999-99-99');
    $(".chzn-select").chosen({
        disable_search_threshold: 8
    });
});

function fetch_plan() {
    plan.url = "/admin/pm/talent_develope/plan/" + $("#up_id").val();
    plan.fetch();
}

function fetch_type() {
    type.url = "/admin/pm/talent_develope/type_bb";
    type.fetch();
}

function fetch_learn() {
    learn.url = "/admin/pm/talent_develope/learn_bb";
    learn.fetch();
}

function fetch_check() {
    check.url = "/admin/pm/talent_develope/check_bb";
    check.fetch();
}

function get_data(id, talent) {
    var found = _.find(talent, function(temp) {
        return temp._id == String(id)
    })
    return found;
}

function delete_data(id, data) {
    var found = _.filter(data, function(x) {
        return x._id != String(id)
    })
    return found;
}

function go_back() {
    window.location.href = "/admin/pm/talent_develope/plan_list"
}
// var init_talbe = function() {
//     var dontSort = [];
//     $('#tblTaskItems thead th').each(function() {
//         if ($(this).hasClass('no_sort')) {
//             dontSort.push({
//                 "bSortable": false
//             });
//         } else {
//             dontSort.push(null);
//         }
//     });
//     otblTaskItems = $('#tblTaskItems').dataTable({
//         //"sDom": "<'row-fluid table_top_bar'<'span12'<'to_hide_phone' f>>>t<'row-fluid control-group full top' <'span4 to_hide_tablet'l><'span8 pagination'p>>",
//         "aaSorting": [
//             [0, "asc"],
//         ],
//         "bPaginate": true,

//         "sPagicostcenterType": "full_numbers",
//         "bAutoWidth": false,
//         "bJQueryUI": false,
//         "aoColumns": dontSort,
//         "oLanguage": {
//             "sUrl": (i18n.lng() == 'zh') ? "/pagejs/dataTables.chinese.json" : ""
//         },
//         // "bDestroy": true,

//         "fnInitComplete": function(oSettings, json) {
//             $(".chzn-select, .dataTables_length select").chosen({
//                 disable_search_threshold: 10
//             });
//         }
//     });

// }
