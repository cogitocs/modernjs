var otblDevelopePlan, people_data, attach_data, divide_single_data, parent_id, single_up_id;
Handlebars.registerHelper('toISODate', function(date) {
    return moment(date).format('YYYY-MM-DD');
});
Handlebars.registerHelper('begin_position', function(p, s, e) {
    // return moment(date).format('YYYY-MM-DD');
    var history_data = people_data[String(p)];
    var filter_data = _.filter(history_data, function(temp) {
        return moment(temp.start_time).isBefore(s)
    })
    var data = _.sortBy(filter_data, function(data) {
        return data.start_time
    })
    data = data.reverse()
    return data[0].position.position_name
});
Handlebars.registerHelper('now_position', function(p, s, e) {
    var history_data = people_data[String(p)];
    var filter_data = _.filter(history_data, function(temp) {
        return moment(temp.end_time).isAfter(e)
    })
    var data = _.sortBy(filter_data, function(data) {
        return data.start_time
    })
    data = data.reverse()
    return data[0].position.position_name
});
Handlebars.registerHelper('status', function(plan_s, plan_e) {
    var status;
    if (moment(plan_s).isBefore(new Date()) && moment(plan_e).isAfter(new Date())) {
        status = '<span class="label label-info">进行中</span>'
    } else if (moment(plan_s).isAfter(new Date())) {
        status = '<span class="label label-info">未开始</span>'
    } else {
        status = '<span class="label label-info">已结束</span>'
    }
    return status;
});
Handlebars.registerHelper('direct', function(data) {
    // 
    var filter_data = _.find(direct.models, function(temp) {
        return temp.attributes._id == String(data)
    })
    return filter_data ? filter_data.attributes.direct_name : ''
});
Handlebars.registerHelper('direct_detail', function(direct_id) {
    // 
    var
        item = [];
    var data = _.find(direct.models, function(temp) {
        return temp.attributes._id == String(direct_id)
    })
    if (data) {

        item.push('<table class="table table-striped table-bordered" cellpadding="5" cellspacing="0" ><tbody>');
        item.push('<tr>')
        item.push('<th width="35%">目标职务</th>')
        item.push('<th width="65%">目标职位</th>')
        item.push('</tr>')

        _.each(data.attributes.data, function(car) {
            var pos_data = _.map(car.des_position_data, function(p) {
                return '<span class="label label-info">' + p.des_position_name + '</span>&nbsp;'
            })
            item.push('<tr>')
            item.push('<td><span class="label label-info">' + car.des_career_name + '</span></td>')
            item.push('<td>' + pos_data.join('') + '</td>')
            item.push('</tr>')

        })
        item.push('</tbody></table>');

    }
    return item.join('')
});
// Han
Handlebars.registerHelper('period', function(field, lambda) {
    if (field == 'validFrom') {
        return moment(lambda[field]).format('YYYY-MM-DD')
    } else {
        return lambda[field]
    }
});
var Plan = Backbone.Model.extend({
    idAttribute: "_id",
    rootUrl: '/admin/pm/talent_develope/plan',
    url: function() {
        return this.rootUrl + '/' + this.id;
    },
});
var Plans = Backbone.Collection.extend({
    model: Plan,
    url: '/admin/pm/talent_develope/plan',
});
var Direct = Backbone.Model.extend({
    idAttribute: "_id",
    rootUrl: '/admin/pm/develope_direct/bb',
    url: function() {
        return this.rootUrl + '/' + this.id;
    },
});
var Directs = Backbone.Collection.extend({
    model: Direct,
    url: '/admin/pm/develope_direct/bb',
});
var PlanListView = Backbone.View.extend({
    el: '#plan_list',
    template: Handlebars.compile($("#tmp_plan").html()),
    render: function() {
        var self = this;
        var rendered_data = _.map(plan.models, function(x) {
            return self.template(x.attributes)
        })
        this.$el.html(rendered_data.join(''));
        return this;
    },
})
var plan = new Plans();
var plan_single = new Plans();
var direct = new Directs();
var plan_view = new PlanListView({
    collection: plan
})
$(document).ready(function() {

    async.series({
        people: function(cb) {
            $.get('/admin/pm/talent_develope/people', function(data) {
                if (data) {
                    people_data = data.data;
                }
                cb(null, 'OK')
            })
        },
        file: function(cb) {
            //附件数据的获取
            $.get('/admin/pm/talent_develope/file', function(data) {
                if (data) {
                    attach_data = data.data

                }
            })
            cb(null, 'OK')
        },
        direct: function(cb) {
            direct.fetch().done(function() {
                cb(null, 'OK')
            })
        },
        plan: function(cb) {
            plan.fetch().done(function() {
                cb(null, 'OK')
            })
        },
        init: function(cb) {
            if ($.fn.DataTable.fnIsDataTable(document.getElementById('tblDevelopePlan'))) {
                $('#tblDevelopePlan').dataTable().fnClearTable();
                $('#tblDevelopePlan').dataTable().fnDestroy();
            };
            cb(null, null)
        },

    }, function(err, result) {
        plan_view.render();
        init_datatable();

    })

    // init_datatable()
    $("#tblDevelopePlan tbody")
        .on('click', '.btn_toggle_detail', function(event) { //只响应正常的行

            // .on('click', 'tr.odd, tr.even', function(event) { //只响应正常的行
            event.preventDefault();
            // console.log('tr->', event.target);
            // var nTr = $(this)[0];
            var nTr = $(this).parent().parent().parent()[0];
            var oTable = $("#tblDevelopePlan").dataTable();
            if (oTable.fnIsOpen(nTr)) {
                oTable.fnClose(nTr);
            } else {
                oTable.fnOpen(nTr, fnFormatDetails(oTable, nTr), 'details');
            }
        })
        .on('click', '.btn_edit', function(event) { //只响应正常的行

            event.preventDefault();
            var up_id = $(this).data("up_id");
            window.location.href = '/admin/pm/talent_develope/plan_bbform?up_id=' + up_id

        })
        .on('click', '.btn_remove', function(event) { //只响应正常的行
            event.preventDefault();
            // var found = delete_data(up_id, data)
            var plans = plan.get($(this).data("id"));
            if (confirm("确认删除培养方向名称吗？一旦删除将无法恢复！")) {
                plans.destroy({
                    success: function() {
                        show_notify_msg('培养计划删除成功', 'OK');
                        fetch_plan();
                        plan_view.render();
                    }
                });
            };
        })
    //培养子计划的数据保存
    $("body")
        .on('click', '.btn-save', function(event) {
            event.preventDefault();
            var self = $(this);
            var up_id = self.data("up_id");
            var parent_id = self.data("parent");
            var plans = plan.get(parent_id);
            plans.save(plans.attributes, {
                success: function(model, response, options) {
                    show_notify_msg('更改已保存', 'OK');
                    fetch_plan();
                    // plan_view.render();
                },
                error: function(model, xhr, options) {
                    show_notify_msg('保存失败', 'ERR');
                }
            })
        })
    //btn_post_ss_comments 留言功能
    .on('click', '.btn_post_ss_comments', function(event) {
        event.preventDefault();
        var self = $(this);
        var up_id = self.data("up_id");
        var parent_id = self.data("parent");
        fetch_single_plan(parent_id)
        // console.log(plan_single.models[0].attributes);
        // console.log(up_id);
        var divide_single_datas = _.find(plan_single.models[0].attributes.plan_divide, function(x) {
            return x._id == String(up_id)
        })
        var comments = divide_single_datas.comments;
        var data = [];
        comments.push({
            people: $("#login_people").val(),
            message: $("#message" + up_id).val(),
            post_time: new Date(),
            avatar: $("#avatar").val(),
            people_name: $("#people_name").val()
        })
        var mess = '<li class="in">';
        mess += '<img class="avatar" src="/gridfs/get/' + $("#avatar").val() + '"></img>';
        mess += '<div class="message"><span class="arrow"></span><span class="datetime"><span class="label label-info">' + moment(new Date()).fromNow() + '</span></span><span class="body">' + $("#message" + up_id).val() + '</span></div>'
        mess += '</li>';
        data.push(mess)
        divide_single_datas.comments = comments;
        plan_single.models[0].save(plan_single.models[0].attributes, {
            success: function(model, response, options) {
                fetch_single_plan(parent_id);
                $("#ul" + up_id).append(data.join(''))
                $("#message" + up_id).val('')

            },
            error: function(model, xhr, options) {
                show_notify_msg('删除失败失败', 'ERR');
            }
        });
    })
    //考核与评估
    .on('change', '.check_summary', function(event) {
        event.preventDefault();
        var self = $(this);
        var up_id = self.data("up_id");
        var parent_id = self.data("parent");
        var divide_single_datas = _.find(plan_single.models[0].attributes.plan_divide, function(x) {
            return x._id == String(up_id)
        })
        divide_single_datas.check_summary = $("#check_summary" + up_id).val();
        plan_single.models[0].save(plan_single.models[0].attributes, {
            success: function(model, response, options) {
                fetch_single_plan(parent_id);
            },
            error: function(model, xhr, options) {
                show_notify_msg('删除失败失败', 'ERR');
            }
        });
    })
    //移除附件
    .on('click', '.btn_remove_attachment', function(event) {
        event.preventDefault();
        var self = $(this);
        if (confirm("确认删除附件吗？")) {
            single_up_id = self.data("up_id");
            parent_id = self.data("parent");
            var file_id = self.data("file_id")
            fetch_single_plan(parent_id)
            var divide_single_datas = _.find(plan_single.models[0].attributes.plan_divide, function(x) {
                return x._id == String(single_up_id)
            })
            var attachments = divide_single_datas.attachments;
            var found = _.find(attachments, function(x) {
                    return x.file == file_id;
                })
                //删除grid fs的数据
            $.post('/gridfs/delete', {
                'file_id': file_id
            }, function(data) {
                attachments.splice(attachments.indexOf(found), 1); //删除
                divide_single_datas.attachments = attachments;
                plan.models[0].save(plan.models[0].attributes, {
                    success: function(model, response, options) {
                        fetch_single_plan(parent_id);
                        var remove_tr = $("#tr" + file_id)
                        remove_tr.remove()
                    },
                    error: function(model, xhr, options) {
                        show_notify_msg('删除失败失败', 'ERR');
                    }
                });
            }).fail(function(err) {
                show_notify_msg(err.status + ' ' + err.statusText, 'ERR');
            }).always(function() {
                hide_ajax_loader_s();
            })

        };
    })
    //添加附件
    .on('click', '.btn_add_attachment', function(event) { // 处理上传附件的功能－打开对话框
        event.preventDefault();
        $("#ihModalAttachment").modal('show');

        var self = $(this);
        single_up_id = self.data("up_id");
        parent_id = self.data("parent");
        fetch_single_plan(parent_id);
    })

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
        var divide_single_data = _.find(plan_single.models[0].attributes.plan_divide, function(x) {
            return x._id == String(single_up_id)
        })
        var attachments = divide_single_data.attachments;
        var file_ids = responseJSON.success || [];
        var data = [];
        _.each(file_ids, function(x) {
            attachments.push({
                file: x._id,
                people: $("#login_people").val()
            });
            //附加到表格里
            var ap = '<tr>';
            ap += '<td style="border:1px solid green;"><a href="/gridfs/get/' + x._id + '" target="_blank">' + x.filename + '</a></td>';
            ap += '<td style="border:1px solid green;">' + calcSize(x.length) + '</td>';
            ap += '<td style="border:1px solid green;"><button class="btn btn-small btn_remove_attachment" type="button" data-file_id="' + x._id + '" data-up_id ="' + single_up_id + '" data-parent="' + parent_id + '"><i class="icon-remove text-error"></i></button></td></tr>';
            data.push(ap)

        })
        divide_single_data.attachments = attachments;
        plan_single.models[0].save(plan_single.models[0].attributes, {
            success: function(model, response, options) {
                // show_notify_msg('', 'OK');
                fetch_single_plan(parent_id);
                $("#tblAttachments" + single_up_id).append(data.join(''))
            },
            error: function(model, xhr, options) {
                // show_notify_msg('更改失败', 'ERR');
            }
        });
        $("#ihModalAttachment").modal('hide');
    })
    $('#triggerUpload').click(function() {
        manualuploader.fineUploader('uploadStoredFiles');
    });

});


function fetch_plan() {
    plan.url = "/admin/pm/talent_develope/plan";
    plan.fetch();
}
//单个数据的抽取
function fetch_single_plan(up_id) {
    plan_single.url = "/admin/pm/talent_develope/plan/" + up_id;
    plan_single.fetch();
}

function fetch_direct() {
    direct.url = "/admin/pm/develope_direct/bb";
    direct.fetch();
}

var init_datatable = function() {
    var dontSort = [];
    $('#tblDevelopePlan thead th').each(function() {
        if ($(this).hasClass('no_sort')) {
            dontSort.push({
                "bSortable": false
            });
        } else {
            dontSort.push(null);
        }
    });
    otblDevelopePlan = $('#tblDevelopePlan').dataTable({
        //"sDom": "<'row-fluid table_top_bar'<'span12'<'to_hide_phone' f>>>t<'row-fluid control-group full top' <'span4 to_hide_tablet'l><'span8 pagination'p>>",
        "aaSorting": [
            [0, "asc"],
        ],
        "bPaginate": true,

        "sPagicostcenterType": "full_numbers",
        "bAutoWidth": false,
        "bJQueryUI": false,
        "aoColumns": dontSort,
        "aoColumnDefs": [{
            "bVisible": false,
            "aTargets": [0]
        }],
        "oLanguage": {
            "sUrl": (i18n.lng() == 'zh') ? "/pagejs/dataTables.chinese.json" : ""
        },
        // "bDestroy": destory,
        "fnInitComplete": function(oSettings, json) {
            $(".chzn-select, .dataTables_length select").chosen({
                disable_search_threshold: 10
            });
        }
    });

    $.extend($.fn.dataTableExt.oStdClasses, {
        "s`": "dataTables_wrapper form-inline"
    });
}
var fnFormatDetails = function(oTable, nTr) {
    var aData = oTable.fnGetData(nTr);
    fetch_single_plan(aData[0]);
    var plan_data = _.find(plan.models, function(x) {
        return x.attributes._id == String(aData[0])
    })

    var divide_data = _.sortBy(plan_data.attributes.plan_divide, function(temp) {
        return moment(temp.plan_s).format('yyyymmdd')
    })

    divide_data.reverse()
    //

    //---培养计划明细---//
    var sOut = '<table class="table table-striped table-bordered" cellpadding="5" cellspacing="0" >';
    sOut += '<tbody>';
    if (divide_data.length > 0) {

        sOut += '<tr><strong>培养计划明细:</strong></tr>';
        sOut += '<tr>';
        // sOut += '<table class="table table-striped table-bordered"   border="1" cellpadding="5" cellspacing="0">';
        // sOut += '<tbody>';

        // sOut += '</tbody>';
        // sOut += '</table>';
        _.each(divide_data, function(temp) {
            sOut += '<table class="table table-striped table-bordered"  style="border:2px " border="2" cellpadding="5" cellspacing="0">';
            sOut += '<tbody>';
            //循环表头,有点重复,但还不知道怎么解决不同表的对齐方式
            sOut += '<tr>';
            sOut += '<th width="20%" style="border:1px solid green;"><strong class="label label-success">计划起止时间</strong></th>';
            sOut += '<th width="15%" style="border:1px solid green;"><strong class="label label-success">培养方式</strong></th>';
            sOut += '<th width="15%" style="border:1px solid green;"><strong class="label label-success">培养手段</strong></th>';
            sOut += '<th width="15%" style="border:1px solid green;"><strong class="label label-success">计划安排方式</strong></th>';
            sOut += '<th width="15%" style="border:1px solid green;"><strong class="label label-success">成果评估方式</strong></th>';
            sOut += '<th width="5%"  style="border:1px solid green;"><strong class="label label-success">状态</strong></th>';
            sOut += '<th width="5%"  style="border:1px solid green;"><strong class="label label-success">是否已通过</strong></th>';
            // sOut += '<th width="5%"  style="border:1px solid green;"><strong class="label label-success">操作</strong></th>';
            sOut += '</tr>';

            var type_name = temp.type_name ? temp.type_name : ''
            var style_name = temp.style_name ? temp.style_name : ''
            var learn_name = temp.learn_name ? temp.learn_name : ''
            var check_name = temp.check_name ? temp.check_name : ''
            var status;
            if (moment(temp.plan_s).isBefore(new Date()) && moment(temp.plan_e).isAfter(new Date())) {
                status = '<span class="label label-success">进行中</span>'
            } else if (moment(temp.plan_s).isAfter(new Date())) {
                status = '<span class="label label-success">未开始</span>'
            } else {
                status = '<span class="label label-success">已结束</span>'
            }

            //数据行
            sOut += '<tr>';
            sOut += '<td style="border:1px solid green;"><span class="label label-success btn-dp" style="cursor: pointer;">起</span><span style="padding-right:2px">' + moment(temp.plan_s).format('YYYY-MM-DD') + '</span><span class="label label-success btn-dp" style="cursor: pointer;">止</span><span style="padding-right:2px">' + moment(temp.plan_e).format('YYYY-MM-DD') + '</span></td>';
            sOut += '<td style="border:1px solid green;">' + type_name + '</td>';
            sOut += '<td style="border:1px solid green;">' + style_name + '</td>';
            sOut += '<td style="border:1px solid green;">' + learn_name + '</td>';
            sOut += '<td style="border:1px solid green;">' + check_name + '</td>';
            sOut += '<td style="border:1px solid green;">' + status + '</td>';
            if (temp.pass) {
                sOut += '<td style="border:1px solid green;"><span class="label label-success">已通过</span></td>';
            } else {
                sOut += '<td style="border:1px solid green;"><span class="label label-success">未通过</span></td>';
            }
            // sOut += '<td style="border:1px solid green;"><button class="btn btn-small btn-remove" type="button"><i class="icon-remove text-info"></i></button></td>';



            sOut += '</tr>';
            //第三层数据

            sOut += '<tr>';
            sOut += '<table class="table table-bordered"  style="margin-left:50px;width:1000px;border: 1px solid green;color:green" border="1" cellpadding="5" cellspacing="0">';
            sOut += '<tbody>';
            //导师和课程
            sOut += '<tr><td><div class ="accordion" id="tutor_class">';
            sOut += '<div class="accordion-group">';
            sOut += '<div class="accordion-heading">';
            sOut += '<a class="accordion-toggle" data-toggle="collapse" data-parent="#tutor_class" href="%#' + temp._id + '-inner0"><i class="icon-user">导师与课程</i></a>'
            sOut += '</div>';
            sOut += '<div class="accordion-body collapse" id="' + temp._id + '-inner0">';
            sOut += '<div class="accordion-inner">';
            //添加导师
            sOut += '<button id="select_mentor' + temp._id + '" class="btn btn-small btn-success btn_add_mentor" type="button">';
            sOut += '<i class="icon-plus">选择导师</i></button>'
            //@
            sOut += '<table class="table responsive table-striped table-bordered"  style="width:100%;margin-bottom:0;solic green;color:black">';
            sOut += '<tbody>';
            sOut += '<tr>';
            sOut += '<th width="20%" style="border:1px solid green;"><strong >导师</strong></th>';
            sOut += '<th width="15%" style="border:1px solid green;"><strong >职位</strong></th>';
            sOut += '<th width="15%" style="border:1px solid green;"><strong >操作</strong></th>';
            sOut += '</tr>';


            sOut += '<tr>';
            sOut += '<td style="border:1px solid green;">' + check_name + '</td>';
            sOut += '<td style="border:1px solid green;">' + check_name + '</td>';
            sOut += '<td style="border:1px solid green;">' + check_name + '</td>';

            sOut += '</tr>';
            sOut += '</tbody>';

            sOut += '</tbody>';
            sOut += '</table>';
            sOut += '<hr></hr>'

            //@
            //添加课程
            sOut += '<button id="select_class' + temp._id + '" class="btn btn-small btn-success btn_add_class" type="button">';
            sOut += '<i class="icon-plus">选择课程</i></button>'
            //@
            sOut += '<table class="table responsive table-striped table-bordered"  style="width:100%;margin-bottom:0;solic green;color:black">';
            sOut += '<tbody>';
            sOut += '<tr>';
            sOut += '<th width="20%" style="border:1px solid green;"><strong >课程名称</strong></th>';
            sOut += '<th width="15%" style="border:1px solid green;"><strong >课程地点</strong></th>';
            sOut += '<th width="15%" style="border:1px solid green;"><strong >操作</strong></th>';
            sOut += '</tr>';


            sOut += '<tr>';
            sOut += '<td style="border:1px solid green;">' + check_name + '</td>';
            sOut += '<td style="border:1px solid green;">' + check_name + '</td>';
            sOut += '<td style="border:1px solid green;">' + check_name + '</td>';

            sOut += '</tr>';
            sOut += '</tbody>';

            sOut += '</tbody>';
            sOut += '</table>';
            //@
            sOut += '</div>';
            sOut += '</div>';
            sOut += '</div>';

            sOut += '</div></td></tr>';
            //过程沟通与记录 附件 导师和课程 
            sOut += '<tr><td><div class ="accordion" id="tutor_class">';
            sOut += '<div class="accordion-group">';
            sOut += '<div class="accordion-heading">';
            sOut += '<a class="accordion-toggle" data-toggle="collapse" data-parent="#tutor_class" href="%#' + temp._id + '-inner1"><i class="icon-comments-alt">过程记录与沟通</i></a>'
            sOut += '</div>';
            sOut += '<div class="accordion-body collapse" id="' + temp._id + '-inner1">';
            sOut += '<div class="accordion-inner">';
            //沟通信息&留言@
            sOut += '<div class="input-append" style="width:50%">';
            sOut += '<input type="text" style="width:60%" data-field="NO_FIELD" placeholder="沟通消息" id="message' + temp._id + '"></input>'
            sOut += '<button class="btn btn-success btn_post_ss_comments" type="button" id="btn_message' + temp._id + '" data-up_id="' + temp._id + '" data-parent="' + aData[0] + '">留言</button>'
            sOut += '</div>';
            sOut += '<div style="min-height:5px; max-height:150px; width:100%; overflow-y:auto">';
            //留言数据展现@
            sOut += '<ul id="ul' + temp._id + '" class="chats">';
            if (temp.comments.length > 0) {
                // var comm_data=[];
                _.each(temp.comments, function(c) {
                    sOut += '<li class="in">';
                    sOut += '<img class="avatar" src="/gridfs/get/' + c.avatar + '"></img>';
                    sOut += '<div class="message"><span class="arrow"></span><span class="datetime"><span class="label label-info">' + moment(c.post_time).fromNow() + '</span></span><span class="body">' + c.message + '</span></div>'
                    sOut += '</li>';
                })
            }
            sOut += '</ul>';
            //@
            sOut += '</div>';
            //@
            sOut += '</div>';
            sOut += '</div>';
            sOut += '</div>';

            sOut += '</div></td></tr>';

            //考核与评估@
            sOut += '<tr><td><div class ="accordion" id="tutor_class">';
            sOut += '<div class="accordion-group">';
            sOut += '<div class="accordion-heading">';
            sOut += '<a class="accordion-toggle" data-toggle="collapse" data-parent="#tutor_class" href="%#' + temp._id + '-inner3"><i class="icon-pencil">考核与评估</i></a>'
            sOut += '</div>';
            sOut += '<div class="accordion-body collapse" id="' + temp._id + '-inner3">';
            sOut += '<div class="accordion-inner">';
            //textarea
            sOut += '<textarea id="check_summary' + temp._id + '" class="check_summary" row="4" style="width:700px" placeholder="考核与评估" data-up_id="' + temp._id + '" data-parent="' + aData[0] + '">';
            if (temp.check_summary) {
                sOut += temp.check_summary;
            }
            sOut += '</textarea>';

            sOut += '</div>';
            sOut += '</div>';
            sOut += '</div>';

            sOut += '</div></td></tr>';
            //添加附件
            sOut += '<tr><td><div class ="accordion" id="tutor_class">';
            sOut += '<div class="accordion-group">';
            sOut += '<div class="accordion-heading">';
            sOut += '<a class="accordion-toggle" data-toggle="collapse" data-parent="#tutor_class" href="%#' + temp._id + '-inner2"><i class="icon-paper-clip">相关附件</i></a>'
            sOut += '</div>';
            sOut += '<div class="accordion-body collapse" id="' + temp._id + '-inner2">';

            sOut += '<div class="accordion-inner">';
            //@内嵌表
            //添加按钮@
            sOut += '<button class="btn btn-small btn-success btn_add_attachment" type="button" id="btn_add_attachment' + temp._id + '" data-up_id="' + temp._id + '" data-parent="' + aData[0] + '">';
            sOut += '<i class="icon-plus">添加新附件</i></button>'
            //@
            sOut += '<table class="table responsive table-striped table-bordered"  style="width:100%;margin-bottom:0;solic green;color:black">';
            sOut += '<tbody id="tblAttachments' + temp._id + '">';
            sOut += '<tr>';
            sOut += '<th width="30%" style="border:1px solid green;"><strong >文件名</strong></th>';
            sOut += '<th width="30%" style="border:1px solid green;"><strong >大小</strong></th>';
            sOut += '<th width="5%" style="border:1px solid green;"><strong >操作</strong></th>';
            sOut += '</tr>';



            if (temp.attachments.length > 0) {
                var temp_a = [];
                _.each(temp.attachments, function(t) {
                    temp_a.push(String(t.file))
                })
                var attach_temp = _.filter(attach_data, function(a) {
                    return !!~temp_a.indexOf(String(a._id))
                })
                _.each(attach_temp, function(attach) {
                    sOut += '<tr id="tr' + attach._id + '">';
                    var size = calcSize(attach.length);
                    sOut += '<td style="border:1px solid green;"><a href="/gridfs/get/' + attach._id + '" target="_blank">' + attach.filename + '</a></td>';
                    sOut += '<td style="border:1px solid green;">' + calcSize(attach.length) + '</td>';
                    sOut += '<td style="border:1px solid green;"><button class="btn btn-small btn_remove_attachment" type="button" data-file_id="' + attach._id + '" data-up_id ="' + temp._id + '" data-parent="' + aData[0] + '"><i class="icon-remove text-error"></i></button></td>';
                    sOut += '</tr>';
                })
            } else {
                sOut += '<td>暂无附件</td><td></td><td></td>'
            }


            sOut += '</tbody>';

            sOut += '</tbody>';
            sOut += '</table>';
            //@
            sOut += '</div>';
            sOut += '</div>';
            sOut += '</div>';
            sOut += '</div></td></tr>';
            //保存按钮
            sOut += '<tr>';
            sOut += '<td><div class="row-fluid"><button class="btn span12 btn-success btn-save" id="btn_save' + temp._id + '" data-up_id="' + temp._id + '" data-parent="' + aData[0] + '">';

            sOut += '保 存</button></div></td>';
            sOut += '</tr>';

            sOut += '</tbody>';
            sOut += '</table>';

            sOut += '</tr>';

            sOut += '</tbody>';
            sOut += '</table>';

        })
        // sOut += '</tbody>';
        // sOut += '</table>';
    } else {
        sOut += '<tr><th colspan="4"><strong>该人员无培养计划明细数据!</strong></th></tr>';

    }
    sOut += '</tr>';
    sOut += '</tbody>';
    sOut += '</table>';
    return sOut;
}
