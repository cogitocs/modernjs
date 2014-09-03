/*
@by 彭双辉
www.zhisiyun.com
2014-6-9
*/
var tm_work_plan, work_time_all, work_calendar_all, pep_calendar = null;
var weekday = {
  '0': '周日',
  '1': '周一',
  '2': '周二',
  '3': '周三',
  '4': '周四',
  '5': '周五',
  '6': '周六',

};
Handlebars.registerHelper('indure', function(data, data1, data2) {
  var week_now = moment(data1).weeks();
  if (week_now % 2) {
    var week_prop = 'E';
  } else {
    var week_prop = 'O';
  };
  if (data2) {
    var week_data = _.find(data2, function(temp) {
      return temp.which_calendar == week_prop || temp.which_calendar == 'A';
    });
    var calendar = _.find(work_calendar_all, function(temp) {
      return temp._id == String(week_data.calendar)
    });
    var work_cal = _.map(calendar.cycle_period, function(data) {
      return String(data.weekday);
    });

  } else {
    var work_cal = [];
  }
  if (!~work_cal.indexOf(String(moment(data1).day()))) {
    return ''
  } else {
    if (data) {
      return data + '<sapn style="border-radius:10px" class="label label-warning">分钟</span>'
    }
  }


});
Handlebars.registerHelper('comment', function(comment) {
  if (comment) {
    var split_data = String(comment).split('');
    if (split_data.length > 5) {
      return '<div title="' + split_data.join('') + '">' + split_data.slice(0, 5).join('') + '...</div>';
    } else {
      return comment;
    }
  } else {
    return comment;
  }
});
Handlebars.registerHelper('card', function(card_time, work_time) {
  if (work_time && card_time) {
    if (!work_time.is_cross_day) {
      return card_time;

    } else {
      return card_time + '<span class="label label-warning" style="border-radius:10px">跨天</sapn>'
    }
  } else {
    return card_time;
  }
});
Handlebars.registerHelper('state1', function(work_on_time, come_time, indure_time_on, card_time, work_calendar) {
  var week_now = moment(card_time).weeks();
  if (week_now % 2) {
    var week_prop = 'E';
  } else {
    var week_prop = 'O';
  };
  if (work_calendar) {
    var week_data = _.find(work_calendar, function(temp) {
      return temp.which_calendar == week_prop || temp.which_calendar == 'A';
    });
    var calendar = _.find(work_calendar_all, function(temp) {
      return temp._id == String(week_data.calendar)
    });
    var work_cal = _.map(calendar.cycle_period, function(data) {
      return String(data.weekday);
    });

  } else {
    var work_cal = [];
  }
  if (!~work_cal.indexOf(String(moment(card_time).day()))) {
    return '休息日'
  } else {
    var data_temp = moment(come_time).format("HH:mm:SS");
    var data = (moment.duration(data_temp) - moment.duration(work_on_time)) / 60000;
    var late_time = moment.duration(data, 'minutes').hours() + '时' + moment.duration(data, 'minutes').minutes() + '分';
    if (data > indure_time_on) {

      return '<sapn style="border-radius:10px" class="label label-warning">迟到</span>' + late_time;
    } else if (!come_time) {
      return '<sapn style="border-radius:10px" class="label label-warning">未打卡</span>';
    } else {
      return '<sapn style="border-radius:10px" class="label label-warning">正常</span>';

    }
  }


});
Handlebars.registerHelper('state2', function(work_off_time, leave_time, data2, data3, data4, data5, data6, data7, data8, card_time) {
  //if bool == true 当天 false 跨天
  if (card_time && leave_time) {
    var bool = (moment(leave_time).format('YYYY-MM-DD') == String(card_time)) ? true : false;

  } else {
    var bool = true;
  }
  var week_now = moment(data3).weeks();
  if (week_now % 2) {
    var week_prop = 'E';
  } else {
    var week_prop = 'O';
  };
  if (data7) {
    var week_data = _.find(data7, function(temp) {
      return temp.which_calendar == week_prop || temp.which_calendar == 'A';
    });
    var calendar = _.find(work_calendar_all, function(temp) {
      return temp._id == String(week_data.calendar)
    });
    var work_cal = _.map(calendar.cycle_period, function(data) {
      return String(data.weekday);
    });
  } else {
    var work_cal = [];
  }

  if (!~work_cal.indexOf(String(moment(data3).day()))) {
    return '休息日'
  } else {
    //对于下班未打卡的，算矿工.
    if (leave_time) {
      //下班打了卡
      //可能休息时间走的
      //可能休息之前走的
      //可能休息之后走的
      data1 = data5 ? data6 : moment(leave_time).format("HH:mm:SS");
      //下午,休息过后
      if (moment.duration(data1) - moment.duration(data8.rest_end) > 0) {
        var data = (moment.duration(data1) - moment.duration(work_off_time)) / 60000;
        //休息时间内
      } else if (moment.duration(data1) >= moment.duration(data8.rest_start) && moment.duration(data1) <= moment.duration(data8.rest_end)) {
        var data = (moment.duration(data8.rest_end) - moment.duration(work_off_time) + data2 * 10000) / 60000;
      } else {
        //休息之前早退
        var data = (moment.duration(data1) - moment.duration(work_off_time) + (moment.duration(data8.rest_end) - moment.duration(data8.rest_start))) / 60000;
      }
    } else {
      data1 = moment(data4).format("HH:mm:SS");
      var data = (moment.duration(data1) - moment.duration(work_off_time) + (moment.duration(data8.rest_end) - moment.duration(data8.rest_start))) / 60000;
    }
    var late_time = moment.duration(-data, 'minutes').hours() + '时' + moment.duration(-data, 'minutes').minutes() + '分';
    if (-data > data2) {
      return '<sapn style="border-radius:10px" class="label label-warning">早退</span>' + late_time;
    } else {
      return '<sapn style="border-radius:10px" class="label label-warning">正常</span>';

    }
  }

});
Handlebars.registerHelper('sign', function(data, data1, data2) {
  var week_now = moment(data1).weeks();
  if (week_now % 2) {
    var week_prop = 'E';
  } else {
    var week_prop = 'O';
  };
  if (data2) {
    var week_data = _.find(data2, function(temp) {
      return temp.which_calendar == week_prop || temp.which_calendar == 'A';
    });
    var calendar = _.find(work_calendar_all, function(temp) {
      return temp._id == String(week_data.calendar)
    });
    var work_cal = _.map(calendar.cycle_period, function(data) {
      return String(data.weekday);
    });
    if (!~work_cal.indexOf(String(moment(data1).day()))) {
      return weekday[String(moment(data1).day())] + '休息'
    } else {
      return data
    }
  }

});
Handlebars.registerHelper('style', function(which_sign_style) {
  var style_obj = {
    'P': 'PC签到',
    'M': '移动签到',
    'I': '考勤机'
  };
  return '<span class="label label-warning">' + style_obj[which_sign_style] + '</span>'

});
Handlebars.registerHelper('moment', function(card_time, leave_time) {
  moment.lang('zh-cn', {
    meridiem: function(hour, minute, isLower) {
      if (hour < 9) {
        return "<span class='label label-warning' style='border-radius:10px'>早上<span>";
      } else if (hour >= 9 && hour < 11) {
        return "<span class='label label-warning' style='border-radius:10px'>上午<span>";
      } else if (hour >= 11 && hour < 13) {
        return "<span class='label label-warning' style='border-radius:10px'>中午<span>";
      } else if (hour >= 13 && hour < 18) {
        return "<span class='label label-warning' style='border-radius:10px'>下午<span>";
      } else {
        return "<span class='label label-warning' style='border-radius:10px'>晚上<span>";
      }
    },
  });
  if (leave_time) {
    var bool = (moment(leave_time).format('YYYY-MM-DD') == String(card_time)) ? true : false;
    // console.log(work_time);
    if (bool) {
      return moment(leave_time).format("hh:mm:ss a");

    } else {
      return (moment(leave_time).format("hh:mm:ss a")) + '<span class="label label-warning" style="border-radius:10px">跨天</span>';

    }


  } else {
    return '<span class="label label-warning">未打卡</span>'
  }
});
var Cardrecord = Backbone.Model.extend({
  idAttribute: "_id",
  rootUrl: '/admin/tm/card_record/bb',
  url: function() {
    return this.rootUrl + '/' + this.id;
  },
});
var Cardrecords = Backbone.Collection.extend({
  model: Cardrecord,
  url: '/admin/tm/card_record/bb',
});
var CardListView = Backbone.View.extend({
  el: '#record_list',
  template: Handlebars.compile($("#tmp_record").html()),
  render: function() {
    var self = this;
    var record_data = cardrecord.models[0].attributes;
    _.each(record_data.record_data, function(temp) {
      if (pep_calendar) {
        var single_calendar_data = _.find(pep_calendar.calendar_data, function(data) {
          return data.job_date == String(moment(temp.card_time).format('YYYY-MM-DD'))
        });
        if (single_calendar_data) {
          var tm_data = _.find(tm_work_plan, function(data) {
            return data._id == String(single_calendar_data.work_plan)
          });
          tm_data.work_time = single_calendar_data.work_time;
        } else {
          var tm_data = _.find(tm_work_plan, function(data) {
            return moment(temp.card_time).isBefore(data.expire_off) && moment(temp.card_time).isAfter(data.expire_on);
          });
          if (tm_data) {
            //如果有更改过的工作计划数据，则取这里面的工作时间.
            if (tm_data.calendar_data.length > 0) {
              var single_calendar_data_2 = _.find(tm_data.calendar_data, function(data) {
                return data.job_date == String(moment(temp.card_time).format('YYYY-MM-DD'))
              });
              if (single_calendar_data_2) {
                tm_data.work_time = single_calendar_data_2.work_time;
              }
            }
          }

        }

      } else {
        var tm_data = _.find(tm_work_plan, function(data) {
          return moment(temp.card_time).isBefore(data.expire_off) && moment(temp.card_time).isAfter(data.expire_on);
        });
        if (tm_data) {
          //如果有更改过的工作计划数据，则取这里面的工作时间.
          if (tm_data.calendar_data.length > 0) {
            var single_calendar_data_2 = _.find(tm_data.calendar_data, function(data) {
              return data.job_date == String(moment(temp.card_time).format('YYYY-MM-DD'))
            });
            if (single_calendar_data_2) {
              tm_data.work_time = single_calendar_data_2.work_time;
            }
          }
        }
      }

      if (tm_data) {
        var work_time = _.find(work_time_all, function(data) {
          return data._id == String(tm_data.work_time)
        });

        // var work_calendar = _.find(work_calendar_all, function(data) {
        //   return data._id == String(tm_data.work_calendar)
        // });
        if (work_time) {
          temp.work_on_time = work_time.work_on_time;
          temp.work_off_time = work_time.work_off_time;
          temp.indure_time_on = work_time.indure_time_on;
          temp.indure_time_off = work_time.indure_time_off;
          temp.work_time = work_time;

        }

        temp.work_calendar = tm_data.work_calendar;

      }

    })
    this.$el.html(self.template(record_data));
    return this;
  },
})
var cardrecord = new Cardrecords();
var card_list_view = new CardListView({
  collection: cardrecord
});
$(document).ready(function() {
  async.series({
    fetch: function(cb) {
      cardrecord.url = "/admin/tm/cardrecord/bb/" + $("#record_id").val();

      cardrecord.fetch().done(function() {
        cb(null, 'ok')
      })
    },
    get_data: function(cb) {
      var o = {
        people: $("#pep_id").val()
      };
      $.post('/admin/tm/cardrecord/record_json_data', o, function(data) {
        if (data && data.code == 'OK') {
          work_time_all = data.time;
          work_calendar_all = data.calendar;
          tm_work_plan = data.plan;
          pep_calendar = data.pep_calendar;
          cb(null, 'ok')
        } else {
          cb(null, 'err');
        }
      })
    },
    init: function(cb) {
      if ($.fn.DataTable.fnIsDataTable(document.getElementById('tblCardRecord'))) {
        $('#tblCardRecord').dataTable().fnClearTable();
        $('#tblCardRecord').dataTable().fnDestroy();
      };
      cb(null, null)
    }
  }, function(err, result) {
    card_list_view.render();
    init_datatable();

  })
})


function card_record_fecth() {
  cardrecord.url = "/admin/tm/cardrecord/bb/" + $("#record_id").val();
  cardrecord.fetch();
}
var init_datatable = function() {
  $('#tblCardRecord').dataTable({
    "aaSorting": [
      [0, "asc"],
    ],
    "bPaginate": true,

    "sPagicostcenterType": "full_numbers",
    "bAutoWidth": false,
    "bJQueryUI": false,
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