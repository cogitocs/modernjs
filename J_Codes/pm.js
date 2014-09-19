// schema for pm
var mongoose = require('mongoose');
var valid = require('./valid');
var async = require('async');

//云指标库，跨client
var CommonIndexSchema = mongoose.Schema({
    pi_name: { //指标名称
        type: String,
        required: true
    },
    industries: [{ //行业
        type: mongoose.Schema.Types.ObjectId,

        ref: 'Industry'
    }],
    reference_values: [{ //参考标准值

        type: mongoose.Schema.Types.ObjectId,
        ref: 'ReferenceValue',
    }],
    viewport: { //绩效视角
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Viewport',
        required: true
    },
    pi_tags: { //指标标签
        type: String,
    },
    index_equation: { //指标公式
        type: String
    },
    pi_unit: { //单位
        type: String,
        //ref: 'IndexUnitPlatform',
    },
    pi_description: { //指标描述
        type: String
    },
    ols: [{ //支撑的目标集
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ObjectiveLibraryPlatform'
    }],
    assessment_purpose: String, //考核目的
    scoring_criteria: String, //评分标准
    ration: {
        type: String,
        'enum': ['1', '2'], //'1:定性', '2:定量'
        default: '2',
    },
    lead: {
        type: String,
        'enum': ['1', '2'], //'1:领先', '2:滞后'
        default: '1',
    },
    result: {
        type: String,
        'enum': ['1', '2'], //'1:结果', '2:驱动'
        default: '1',
    },
    indicator: {
        type: String,
        'enum': ['1', '2', '3', '4'], //'1:越高越好', '2:越低越好', '3:越靠近区间越好', '4:非零即满'
        default: '1',
    },
    inout: {
        type: String,
        'enum': ['1', '2'], //'1:内部', '2:外部'
        default: '1',
    },
    important: {
        type: String,
        'enum': ['1', '2', '3'], //'1:高', '2:中', '3:低'
        default: '2',
    },
    enforceable: {
        type: String,
        'enum': ['1', '2', '3'], //'1:高', '2:中', '3:低'
        default: '2',
    },
    access: {
        type: String,
        'enum': ['1', '2', '3'], //'1:高', '2:中', '3:低'
        default: '3',
    },
    control: {
        type: String,
        'enum': ['1', '2', '3'], //'1:高', '2:中', '3:低'
        default: '2',
    },
    formula_type: { //公式类型
        type: String,
        'enum': ['1', '2', '3', '4', '5'], //'1:越高越好', '2:越低越好', '3:越靠近区间越好', '4:超出扣分', '5:非零即满分'
        default: '1',
    },
    is_sync: {
        type: Boolean,
        default: false,
    },
})

CommonIndexSchema.plugin(valid);
CommonIndexSchema.index({
    client: 1,
    pi_name: 1
}, {
    unique: true,
    dropDups: true
}); //定义复合索引——唯一键
module.exports.CommonIndexSchema = CommonIndexSchema;

//行业——绩效管理用途
var IndustrySchema = mongoose.Schema({
    industry_code: { //行业代码
        type: String,
        required: true,
        unique: true
    },
    industry_name: {}, //行业名称，支持多种语言。
    industry_catalog: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'IndustryCatalog', //行业类型
    },
    indexs: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'CommonIndex', //通用指标库
    }],
    competencies: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Competency', //通用胜任力模型
    }]
})

module.exports.IndustrySchema = IndustrySchema;

IndustrySchema.plugin(valid);

//行业分类
var IndustryCatalogSchema = mongoose.Schema({
    catalog_name: {}, //行业类型，支持多种语言。
    industry_catalog_code: { //行业类型代码
        type: String,
        required: true,
        unique: true
    },
})

module.exports.IndustryCatalogSchema = IndustryCatalogSchema;

IndustryCatalogSchema.plugin(valid);

var ReferenceValueSchema = mongoose.Schema({ //指标库参考标准值
    industry: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Industry',
    }, //绑定行业id
    common_index: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'CommonIndex',
    }, //绑定指标库id
    start_time: Date, //开始时间
    valid_time: Date, //结束时间
    low_value: Number, //最低值
    high_value: Number, //最高值
    mean_value: Number //平均值
})

module.exports.ReferenceValueSchema = ReferenceValueSchema;

ReferenceValueSchema.plugin(valid);
//管理职能——绩效管理用途
var ManagementFunctionSchema = mongoose.Schema({

    management_function_code: { //管理职能代码
        type: String,
        required: true
    },
    management_function_name: {} //管理职能名称，支持多种语言。
})

ManagementFunctionSchema.plugin(valid);

module.exports.ManagementFunctionSchema = ManagementFunctionSchema;
//绩效视角——绩效管理用途
var ViewportSchema = mongoose.Schema({
    viewport_code: { //绩效视角代码
        type: String,
        required: true
    },
    viewport_name: {} //绩效视角名称，支持多种语言。
})

ViewportSchema.plugin(valid);

module.exports.ViewportSchema = ViewportSchema;
//指标类型——绩效管理用途（客户级）
var IndexTypeSchema = mongoose.Schema({
    client: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Client'
    },
    index_type_name: { //指标类型名称
        type: String,
        required: true
    },
    index_type_description: { //指标类型描述
        type: String,
    },
})

IndexTypeSchema.plugin(valid);

IndexTypeSchema.index({
    client: 1,
    index_type_name: 1
}, {
    unique: true,
    dropDups: true
}); //定义复合索引——唯一键

module.exports.IndexTypeSchema = IndexTypeSchema;

//指标单位——绩效管理用途（客户级）
var IndexUnitSchema = mongoose.Schema({
    client: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Client'
    },
    index_unit_name: { //指标单位名称
        type: String,
        required: true
    },
    iso_name: String, //国际名称，英文的单位
    group: {
        type: String,
        // 长度，面积，体积，重量，时间，金钱，其他
        'enum': ['Length', 'Area', 'Volume', 'Weight', 'Time', 'Money', 'Rate', 'Others', 'Others1', 'Others2'],
    },
    is_base_unit: Boolean, //是否为该单位组中的基本计量单位，一个组里面只能有一个基本单位，并且向客户复制的时候必须复制过去。
    rate: { //单位转换时的转换率，用来与基本单位相乘。
        type: Number,
        default: 1
    },
    use: { //默认启用－列表或下拉框中可以列出来供选择
        type: Boolean,
        default: true
    }
})
IndexUnitSchema.plugin(valid);
IndexUnitSchema.index({
    client: 1,
    index_unit_name: 1
}, {
    unique: true,
    dropDups: true
}); //定义复合索引——唯一键
module.exports.IndexUnitSchema = IndexUnitSchema;

//指标单位——绩效管理用途（平台级）
var IndexUnitPlatformSchema = mongoose.Schema({
    index_unit_name: { //指标单位名称，中文的单位
        type: String,
        required: true
    },
    iso_name: String, //国际名称，英文的单位
    group: {
        type: String,
        // 长度，面积，体积，重量，时间，金钱，其他
        'enum': ['Length', 'Area', 'Volume', 'Weight', 'Time', 'Money', 'Rate', 'Others'],
    },
    is_base_unit: Boolean, //是否为该单位组中的基本计量单位，一个组里面只能有一个基本单位，并且向客户复制的时候必须复制过去。
    rate: { //单位转换时的转换率，用来与基本单位相乘。
        type: Number,
        default: 1
    }
})

IndexUnitPlatformSchema.plugin(valid);
IndexUnitPlatformSchema.index({
    index_unit_name: 1
}, {
    unique: true,
    dropDups: true
}); //定义复合索引——唯一键
module.exports.IndexUnitPlatformSchema = IndexUnitPlatformSchema;

//标杆企业
var BenchmarkingEnterprisesSchema = mongoose.Schema({
    benchmarking_enterprises_name: { //企业名称
        type: String,
        required: true
    },
    benchmarking_enterprises_brief_introduction: { //企业简介
        type: String,
        required: true
    },
    period: String, //统计期间，年月字符串, YYYYMM。 例如：201301
    benchmarking_indexs: [{
        commonindex: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'CommonIndex',
        },
        validFrom: { //有效期开始，
            type: Date,
            required: true
        },
        validTo: { //有效期结束，
            type: Date,
            required: true
        },
        score: {
            type: Number,
            required: true
        }
    }]
})

BenchmarkingEnterprisesSchema.plugin(valid);

module.exports.BenchmarkingEnterprisesSchema = BenchmarkingEnterprisesSchema;
//绩效分制-平台
//绩效分制——绩效配置
var PointsSystemSchema = mongoose.Schema({
    points_system_name: { //分制名称
        type: String,
        required: true
    },
    conversion_centesimal_system: { //换算百分制（如5分制为1：20，则该值为20）
        type: Number,
        required: true
    },
    is_base: {
        type: Boolean,
        default: false
    }, //基本分制
    is_invariable: {
        type: Boolean,
        default: false
    }, //如果为true，则不能删除不能编辑
    grades: [{
        grade_name: { //等级名称
            type: String,
            required: true
        },
        grade_low_value: { //最低分
            type: Number,
            required: true
        },
        grade_high_value: { //最高分
            type: Number,
            required: true
        },
        grade_description: { //等级描述
            type: String
        },

    }]
})
PointsSystemSchema.plugin(valid);
PointsSystemSchema.index({
    points_system_name: 1
}, {
    unique: true,
    dropDups: true
}); //定义复合索引——唯一键
module.exports.PointsSystemSchema = PointsSystemSchema;
//绩效分制——绩效配置
var PointsSystemClientSchema = mongoose.Schema({
    client: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Client'
    },
    points_system_name: { //分制名称
        type: String,
        required: true
    },
    conversion_centesimal_system: { //换算百分制（如5分制为1：20，则该值为20）
        type: Number,
        required: true
    },
    is_base: {
        type: Boolean,
        default: false
    }, //基本分制
    is_invariable: {
        type: Boolean,
        default: false
    }, //如果为true，则不能删除不能编辑
    //一个公司只能有一个等级组，一个分制可以设置多个等级组,等级组中适用公司不能重复
    //一种分制只能定义一个等级组，适用client下所有公司,所以人数分布规则可以适用不同的公司,FUCK!
    //等级组不要了//公司适用的等级组,等级组-分制是多对一的关系
    company_force: [{ // choose the company as force forced_distribution_grade_algorithm
        company: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Company'
        },
        if_force: { //是否启用强制分布
            type: Boolean,
            default: false
        },
        rule_id: { //    人数分布区间规则
            type: mongoose.Schema.Types.ObjectId,
            ref: 'ForceDistributionRule'
        },
        //          algorithm_json ={'A':'按公司分布','B':'按自定义公司组分布','C':'按部门分布','D':'按自定义部门组分布'} 
        forced_distribution_grade_algorithm: { //对象分组规则//选择何种强制分布规则    //algorithm_json ={'A':'按公司分布','B':'按自定义公司组分布','C':'按部门分布','D':'按自定义部门组分布'} 
            type: String,
            'enum': ['A', 'B', 'C', 'D'],
            default: 'A'
        },
        is_manager_group: { //是否启用管理者分组分布
            type: Boolean,
            default: false
        },
        manager_group_rule: { //'E':同一层级的管理者分组  'F':自定义管理者分组分布
            type: String,
            'enum': ['E', 'F'],
            default: 'E'
        }

    }],
    grades: [{
        grade_name: { //等级名称
            type: String,
            required: true
        },
        grade_low_value: { //最低分
            type: Number,
            required: true
        },
        grade_high_value: { //最高分
            type: Number,
            required: true
        },
        grade_description: { //等级描述
            type: String
        },
        // items: [{
        //     rule_name: {
        //         type: String,
        //         required: true
        //     },
        //     force_data: [{
        //         pep_low_value: { //人数下限  --含
        //             type: Number,
        //             default: 0
        //         },
        //         pep_high_value: { //人数上限  --不含
        //             type: Number,
        //             default: 0
        //         },
        //         force_scale: { //'1':>= ,'2':<=
        //             type: String,
        //             'enum': ['1', '2'],
        //             default: '2'
        //         },
        //         force_pep_value: { //分布人数
        //             type: Number,
        //             default: 0
        //         },

        //     }]
        // }]

    }]


})
PointsSystemClientSchema.plugin(valid);
PointsSystemClientSchema.index({
    client: 1,
    points_system_name: 1
}, {
    unique: true,
    dropDups: true
}); //定义复合索引——唯一键
module.exports.PointsSystemClientSchema = PointsSystemClientSchema;
//  人数分布规则配置
ForceDistributionRuleSchema = mongoose.Schema({
    client: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Client'
    },
    rule_name: {
        type: String,
        required: true
    },
    rule_descript: {
        type: String
    },
    force_data: [{
        grade_name: {
            type: String,
        },
        pep_low_value: { //人数下限  --含
            type: Number,
            default: 1
        },
        pep_high_value: { //人数上限  --不含
            type: Number,
            default: 1
        },
        force_scale: { //'1':>= ,'2':<=
            type: String,
            'enum': ['1', '2'],
            default: '2'
        },
        force_pep_value: { //分布人数
            type: Number,
        },
        ratio_low: { //分布人数/人数上限  
            type: Number,
        },
        ratio_high: { //分布人数/人数下限
            type: Number
        }

    }],
    points_system: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'PointsSystemClient',
    },
    // force_distribution_group: [{
    //     type: mongoose.Schema.Types.ObjectId,
    //     ref: 'ForceDistributionGroup'
    // }]
})
ForceDistributionRuleSchema.plugin(valid);
ForceDistributionRuleSchema.index({
    client: 1,
    rule_name: 1
}, {
    unique: true,
    dropDups: true
})
module.exports.ForceDistributionRuleSchema = ForceDistributionRuleSchema;
//  自定义强制分布组  ---规则里边放分组
ForceDistributionGroupSchema = mongoose.Schema({
    client: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Client'
    },
    // rule: {//分布规则
    //     type: String,
    // },
    group_name: { //分组名称    
        type: String,
        required: true
    },
    group_descript: { //分组描述
        type: String
    },
    companies: [{ //自定义公司分组       
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Company'
    }],
    organizations: [{ //自定义部门分组
        type: mongoose.Schema.Types.ObjectId,
        ref: 'OrganizationUnit'
    }],
    manager_positions: [{ //自定义管理者职位
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Position'
    }]
})
ForceDistributionGroupSchema.plugin(valid);
ForceDistributionGroupSchema.index({
    client: 1,
    group_name: 1
}, {
    unique: true,
    dropDups: true
})
module.exports.ForceDistributionGroupSchema = ForceDistributionGroupSchema;
//等级组-平台
//等级组——绩效配置
var GradeGroupPlatSchema = mongoose.Schema({
    points_system: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'PointsSystem',
    },
    gg_name: { //等级组名称
        type: String,
        required: true
    },
    gg_description: { //等级组描述
        type: String
    },
    gg_grades: [{
        grade_name: { //等级名称
            type: String,
            required: true
        },
        grade_description: { //等级描述
            type: String
        },
        score: { //对应百分制分数
            type: Number,
            required: true
        }
    }]
})

GradeGroupPlatSchema.plugin(valid);
GradeGroupPlatSchema.index({
    points_system: 1,
    gg_name: 1
}, {
    unique: true,
    dropDups: true
}); //定义复合索引——唯一键
module.exports.GradeGroupPlatSchema = GradeGroupPlatSchema;
//等级组——绩效配置
var GradeGroupSchema = mongoose.Schema({
    client: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Client'
    },
    points_system: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'PointsSystemClient',
    },
    gg_name: { //等级组名称
        type: String,
        required: true
    },
    gg_description: { //等级组描述
        type: String
    },
    gg_grades: [{
        grade_name: { //等级名称
            type: String,
            required: true
        },
        grade_description: { //等级描述
            type: String
        },
        score: { //对应百分制分数
            type: Number,
            required: true
        }
    }]
})

GradeGroupSchema.plugin(valid);
GradeGroupSchema.index({
    client: 1,
    points_system: 1,
    gg_name: 1
}, {
    unique: true,
    dropDups: true
}); //定义复合索引——唯一键
module.exports.GradeGroupSchema = GradeGroupSchema;


//周期管理-详细信息
var PeriodManagementSchema = mongoose.Schema({
    client: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Client'
    },
    company: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Company',
    },
    year: {
        type: String,
        required: true
    },
    period_type: { //1:年,2:半年,3:季，4:月，5:周
        type: String,
        required: true,
        uppercase: true,
        'enum': ['1', '2', '3', '4', '5']
    },
    period_value: Number, //周期值；从0开始，如一月，一季度为0；二月，二季度为1；递增
    period: String, //统计期间，年月字符串, YYYYMM。 例如：201301
    periodFrom: { //周期开始
        type: Date,
        required: true,
    },
    periodTo: { //周期结束
        type: Date,
        required: true,
    },
    arrangedFrom: { //计划开始
        type: Date
    },
    arrangedTo: { //计划结束
        type: Date
    },
    evaluationFrom: { //考核开始
        type: Date
    },
    evaluationTo: { //考核结束
        type: Date
    },
    data_upload_expiration_date: { //数据上传截止日期
        type: Date
    },
    appeal_expiration_date: { //申诉截止日期
        type: Date
    }
})

PeriodManagementSchema.plugin(valid);
PeriodManagementSchema.index({
    client: 1,
    company: 1,
    year: 1,
    period_type: 1,
    period: 1
}, {
    unique: true,
    dropDups: true
}); //定义复合索引——唯一键
module.exports.PeriodManagementSchema = PeriodManagementSchema;
//根据公司和周期名字找到对应的记录
PeriodManagementSchema.statics.getPMByCompanyAndName = function(company, year, period, cb) {
    this.findOne({
        company: company,
        year: year,
        period: period
    }, cb);
}

//考核项清单库
var AssessmentItemSchema = mongoose.Schema({
    client: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Client'
    },
    company: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Company',
    },
    ai_category: { //1:加分项，2:减分项,3：一票否决项
        type: String,
        'enum': ['1', '2', '3'],
    },
    ai_name: {
        type: String,
        required: true,
    },
    ai_score_toplimit: {
        type: Number,
    },
    ai_description: {
        type: String,
    },
    ous: [{ //适用部门
        type: mongoose.Schema.Types.ObjectId,
        ref: 'OrganizationUnit'
    }],
    dp_ous: { //评分部门
        type: mongoose.Schema.Types.ObjectId,
        ref: 'OrganizationUnit'
    },
    dp_peoples: { //评分人
        type: mongoose.Schema.Types.ObjectId,
        ref: 'People'
    },
})
AssessmentItemSchema.plugin(valid);
AssessmentItemSchema.index({
    client: 1,
    company: 1,
    ai_category: 1,
    ai_name: 1,
}, {
    unique: true,
    dropDups: true
}); //定义复合索引——唯一键
module.exports.AssessmentItemSchema = AssessmentItemSchema;

//绩效模板-基本信息
var PMTemplateSchema = mongoose.Schema({
    client: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Client'
    },
    company: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Company',
    },
    points_system: { //分制,默认为公司的基本分制
        type: mongoose.Schema.Types.ObjectId,
        ref: 'PointsSystemClient',
        required: true
    },
    tb_name: { //模板名称
        type: String,
        required: true
    },
    sum_rule: { //W:加权求和,A:算术平均,P:算术乘积--------暂时废除
        type: String,
        required: true,
        uppercase: true,
        'enum': ['W', 'A', 'P'],
        default: 'W'
    },
    items: [{
        item_type: { //类型： 1:定量指标 2:定性指标 3:360评分 4:加分项 5:减分项 6:一票否决
            type: String,
            'enum': ['1', '2', '3', '4', '5', '6'],
        },
        grade_way: { //P:手工输入分数,G:选择等级打分--适用于定性指标(2)
            type: String,
            uppercase: true,
            'enum': ['P', 'G']
        },
        grade_group: { //等级组--选择按等级打分后--适用于定性指标(2)
            type: mongoose.Schema.Types.ObjectId,
            ref: 'GradeGroup',
        },
        grade_upper: { //手工打分上限
            type: Number,
        },
        grade_lower: { //手工打分下限
            type: Number,
        },
        sub_items: [{
            sub_item_name: { //子项名称
                type: String,
            },
            weight: { //子项权重，4、5、6 不写
                type: Number
            },
            sub_item_contents: [{ //考核项--适用（4，5，6）
                type: mongoose.Schema.Types.ObjectId,
                ref: 'AssessmentItem'
            }], //内容信息写在这里
        }],
        greater_or_less: { //大于还是小于--绩效合同用来验证权重
            type: String,
            uppercase: true,
            'enum': ['G', 'L'],
            default: 'G'
        },
        weight: { //权重，4、5、6 不写
            type: Number
        },
        sum_rule: { //W:加权求和,A:算术平均,P:算术乘积----暂时废除
            type: String,
            uppercase: true,
            'enum': ['W', 'A', 'P'],
            default: 'W'
        },
        // ai_grade_way: { //1:上级评分,2:他人评分--适用（4，5）
        //     type: String,
        //     required: true,
        //     'enum': ['1', '2'],
        //     default: '1',
        // },
        item_contents: [{ //考核项
            type: mongoose.Schema.Types.ObjectId,
            ref: 'AssessmentItem'
        }], //内容信息写在这里，例如：加减分的项目、一票否决的项目等。
        self_weight: { //自评权重
            type: Number,
            default: 0
        },
        indirect_weight: { //间接上级评分权重
            type: Number,
            default: 0
        },
        superior_weight: { //直接上级评分权重
            type: Number,
            default: 0
        },
        superior_superior_weight: { //上上级评分权重
            type: Number,
            default: 0
        },
        other_weight: { //他评权重
            type: Number,
            default: 0
        },
        qtcs: [{ //问卷适用的模板,只适用有360考核项的模板
            period_type: { //1:年,2:半年,3:季，4:月，5:周
                type: String,
                uppercase: true,
                'enum': ['1', '2', '3', '4', '5']
            },
            qtc: { //问卷模板
                type: mongoose.Schema.Types.ObjectId,
                ref: 'QuestionnairTemplateClient'
            },
            outsiders: [{ //外部人员
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Outsider'
            }],
            number_of_day: {
                type: Number,
                default: 3
            },
        }],
    }],
    creator: { //本条记录的创建人
        type: mongoose.Schema.Types.ObjectId,
        ref: 'People',
    },
})
PMTemplateSchema.plugin(valid);
PMTemplateSchema.index({
    client: 1,
    company: 1,
    tb_name: 1
}, {
    unique: true,
    dropDups: true
}); //定义复合索引——唯一键
module.exports.PMTemplateSchema = PMTemplateSchema;

//题目类别-平台级
var TopicCategorySchema = mongoose.Schema({
    tc_name: {
        type: String,
        required: true,
    },
    tc_description: String
})
TopicCategorySchema.index({
    tc_name: 1
}, {
    unique: true,
    dropDups: true
}); //定义复合索引——唯一键
TopicCategorySchema.plugin(valid);
module.exports.TopicCategorySchema = TopicCategorySchema;

//题目类别-用户级
var TopicCategoryClientSchema = mongoose.Schema({
    client: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Client'
    },
    tc_name: {
        type: String,
        required: true,
    },
    tc_description: String
})
TopicCategoryClientSchema.index({
    client: 1,
    tc_name: 1
}, {
    unique: true,
    dropDups: true
}); //定义复合索引——唯一键
TopicCategoryClientSchema.plugin(valid);
module.exports.TopicCategoryClientSchema = TopicCategoryClientSchema;

//问卷模板-360能力测评问卷-平台级
var Questionnair360AndCASchema = mongoose.Schema({
    qt_name: { //问卷名称
        type: String,
        required: true
    },
    qt_description: String, //问卷描述
    points_system: { //分制
        type: mongoose.Schema.Types.ObjectId,
        ref: 'PointsSystem',
    },
    questionnair_category: { //问卷类别:1,360考核问卷;2,能力评估问卷;
        type: String,
        required: true,
        'enum': ['1', '2'],
        default: '1'
    },
    weight_loss_rule: { //1:分摊给上级;2:按比例分摊到其他
        type: String,
        required: true,
        'enum': ['1', '2'],
        default: '1'
    },
    score_sampling_rule: { //1:整体平均;2:去掉最高和最低分后平均
        type: String,
        required: true,
        'enum': ['1', '2'],
        default: '1'
    },
    grade_way: { //P:手工输入分数,G:选择等级打分
        type: String,
        required: true,
        uppercase: true,
        'enum': ['P', 'G'],
        default: 'P',
    },
    grade_group: { //等级组--选择按等级打分后
        type: mongoose.Schema.Types.ObjectId,
        ref: 'GradeGroupPlat',
    },
    frequency_of_usage: { //使用频次
        type: Number,
        default: 0
    },
    items: [{
        category: String, //如果为空，则没有二级分类
        weight: Number, //二级分类权重，没有二级分类则为空
        qtis: [{
            qti_name: { //题目名称
                type: String,
                required: true
            },
            source: { //1:新建,2:题库,3:能力素质库
                type: String,
                required: true,
                'enum': ['1', '2', '3'],
                default: '1'
            },
            cd: { //所属维度
                type: mongoose.Schema.Types.ObjectId,
                ref: 'CompetencyDimension'
            },
            competency: { //当数据来源为3时，此处关联胜任力
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Competency'
            },
            scoring_criteria: String, //评分标准
            qti_weight: Number //题目所占权重
        }],
    }],
})
Questionnair360AndCASchema.plugin(valid);

module.exports.Questionnair360AndCASchema = Questionnair360AndCASchema;

//问卷模板-满意度、选项、测验问卷-平台级
var QuestionnairTemplateSchema = mongoose.Schema({
    qt_name: { //问卷名称
        type: String,
        required: true
    },
    qt_description: String, //问卷描述
    points_system: { //分制 
        type: mongoose.Schema.Types.ObjectId,
        ref: 'PointsSystem',
    },
    questionnair_category: { //问卷类别:1.满意度调查问卷;2.选项统计问卷;3.测验测评问卷;
        type: String,
        'enum': ['1', '2', '3'],
        default: '1',
    },
    grade_way: { //P:手工输入分数,G:选择等级打分
        type: String,
        required: true,
        uppercase: true,
        'enum': ['P', 'G'],
        default: 'P',
    },
    grade_group: { //等级组--选择按等级打分后
        type: mongoose.Schema.Types.ObjectId,
        ref: 'GradeGroupPlat',
    },
    frequency_of_usage: { //使用频次
        type: Number,
        default: 0
    },
    //1.满意度调查问卷
    items: [{
        category: String, //如果为空，则没有二级分类
        qtis: [{
            qti_name: { //题目名称
                type: String,
                required: true
            },
            scoring_criteria: String, //评分标准
        }],
    }],
    //2.选项统计问卷
    option_items: [{
        qti_name: { //题目名称
            type: String,
        },
        qti_options: [{
            option: String,
            option_description: String,
        }],
    }],
    //3.测验测评问卷
    test_items: [{
        category: String, //如果为空，则没有二级分类
        score_value: { //分值
            type: Number,
            default: 0,
        },
        qtis: [{
            qti_name: { //题目名称
                type: String,
            },
            qti_type: { //1:单选,2:多选
                type: String,
                'enum': ['1', '2'],
                default: '1',
            },
            qti_score_value: { //分值
                type: Number,
                default: 0,
            },
            qti_options: [{
                option: String,
                option_description: String,
                is_answer: {
                    type: Boolean,
                    default: false
                },
            }],
        }]
    }],
})
QuestionnairTemplateSchema.plugin(valid);

module.exports.QuestionnairTemplateSchema = QuestionnairTemplateSchema;

//问卷模板-用户级
var QuestionnairTemplateClientSchema = mongoose.Schema({
    client: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Client'
    },
    qt_name: { //问卷名称
        type: String,
        required: true
    },
    qt_description: String, //问卷描述
    points_system: { //分制 
        type: mongoose.Schema.Types.ObjectId,
        ref: 'PointsSystemClient',
    },
    questionnair_category: { //问卷类别:1.满意度调查问卷;2.选项统计问卷;3.测验测评问卷;
        type: String,
        'enum': ['1', '2', '3'],
        default: '1',
    },
    grade_way: { //P:手工输入分数,G:选择等级打分
        type: String,
        required: true,
        uppercase: true,
        'enum': ['P', 'G'],
        default: 'P',
    },
    grade_group: { //等级组--选择按等级打分后
        type: mongoose.Schema.Types.ObjectId,
        ref: 'GradeGroup',
    },
    frequency_of_usage: { //使用频次
        type: Number,
        default: 0
    },
    //1.满意度调查问卷
    items: [{
        category: String, //如果为空，则没有二级分类
        qtis: [{
            qti_name: { //题目名称
                type: String,
                required: true
            },
            scoring_criteria: String, //评分标准
        }],
    }],
    //2.选项统计问卷
    option_items: [{
        qti_name: { //题目名称
            type: String,
        },
        qti_options: [{
            option: String,
            option_description: String,
        }],
    }],
    //3.测验测评问卷
    test_items: [{
        category: String, //如果为空，则没有二级分类
        score_value: { //分值
            type: Number,
            default: 0,
        },
        qtis: [{
            qti_name: { //题目名称
                type: String,
            },
            qti_type: { //1:单选,2:多选
                type: String,
                'enum': ['1', '2'],
                default: '1',
            },
            qti_score_value: { //分值
                type: Number,
                default: 0,
            },
            qti_options: [{
                option: String,
                option_description: String,
                is_answer: {
                    type: Boolean,
                    default: false
                },
            }],
        }]
    }],
})
QuestionnairTemplateClientSchema.plugin(valid);

// QuestionnairTemplateClientSchema.index({
//     client: 1,
//     qt_name: 1
// }, {
//     unique: true,
//     dropDups: true
// }); //定义复合索引——唯一键
module.exports.QuestionnairTemplateClientSchema = QuestionnairTemplateClientSchema;

//计分公式-(平台级)
var ScoringFormulaSchema = mongoose.Schema({
    sf_name: { //公式名称
        type: String,
        required: true
    },
    sf_description: String, //公式描述
    sf_type: { //1:越高越好,2:越低越好,3:越靠近区间越好，4:超出扣分，5:非零即满分，6:乘差
        type: String,
        required: true,

    },
    magnification: { //放大倍率
        type: Number,
        default: 1
    },
    s_method: { //计算方式 跳过第二步 S:分段,T:数值表
        type: String,
        // required: true,
        uppercase: true,
        'enum': ['', 'S', 'T'],
        default: ''
    },
    subsection: [{ //分段时，为数组（S/L）
        ftype: { //方程类型：F:固定值 L：线性方程 T：数值表
            type: String,
            uppercase: true,
            'enum': ['F', 'L', 'T'],
            default: 'L'
        },
        r1: Number, //下限－闭区间
        r2: Number, //上限－开区间

        fbody: {}, //函数方程体

    }],
    data_table: [ //数值表－用来实现非线性的分值对应（T）
        {
            x: Number, //输入值
            y: Number, //输出值
        },
    ],
    caps_score: Number, //封顶分（最高分），null为不启用
    base_score: { //保底分（最低分）
        type: Number,
        default: 0
    },
    score_to_zero: Number, //低于本字段分数的自动归0
    priority: { //设定保底分和低于某分数时归零的采用优先级
        type: String,
        uppercase: true,
        'enum': ['B', 'S'],
        default: 'B'
    }
})
ScoringFormulaSchema.plugin(valid);

ScoringFormulaSchema.index({
    sf_type: 1,
    method: 1,
    sf_name: 1,
}, {
    unique: true,
    dropDups: true
}); //定义复合索引——唯一键
module.exports.ScoringFormulaSchema = ScoringFormulaSchema;

//计分公式-(客户级)
var ScoringFormulaClientSchema = mongoose.Schema({
    client: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Client'
    },
    sf_name: { //公式名称
        type: String,
        required: true
    },
    sf_description: String, //公式描述
    sf_type: { //1:越高越好,2:越低越好,3:越靠近区间越好，4:超出扣分，5:非零即满分，6:乘差
        type: String,
        required: true,

    },
    magnification: { //放大倍率
        type: Number,
        default: 1
    },
    s_method: { //计算方式 跳过第二步 S:分段,T:数值表
        type: String,
        // required: true,
        uppercase: true,
        'enum': ['', 'S', 'T'],
        default: ''
    },
    subsection: [{ //分段时，为数组（S/L）
        ftype: { //方程类型：F:固定值 L：线性方程 T：数值表
            type: String,
            uppercase: true,
            'enum': ['F', 'L', 'T'],
            default: 'L'
        },
        r1: Number, //下限－闭区间
        r2: Number, //上限－开区间

        fbody: {}, //函数方程体

    }],
    data_table: [ //数值表－用来实现非线性的分值对应（T）
        {
            x: Number, //输入值
            y: Number, //输出值
        },
    ],
    caps_score: Number, //封顶分（最高分），null为不启用
    base_score: { //保底分（最低分）
        type: Number,
        default: 0
    },
    score_to_zero: Number, //低于本字段分数的自动归0
    priority: { //设定保底分和低于某分数时归零的采用优先级
        type: String,
        uppercase: true,
        'enum': ['B', 'S'],
        default: 'B'
    }
})
ScoringFormulaClientSchema.plugin(valid);

ScoringFormulaClientSchema.index({
    client: 1,
    sf_type: 1,
    s_method: 1,
    sf_name: 1,
}, {
    unique: true,
    dropDups: true
}); //定义复合索引——唯一键

module.exports.ScoringFormulaClientSchema = ScoringFormulaClientSchema;

//计分标准-(客户级)
var ScoringCriteriaClientSchema = mongoose.Schema({
    client: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Client'
    },
    sc_name: { //标准名称
        type: String,
        required: true
    },
    sc_description: { //标准描述
        type: String,
        required: true
    },
})
ScoringCriteriaClientSchema.plugin(valid);

ScoringCriteriaClientSchema.index({
    client: 1,
    sc_name: 1,
}, {
    unique: true,
    dropDups: true
}); //定义复合索引——唯一键

module.exports.ScoringCriteriaClientSchema = ScoringCriteriaClientSchema;
//计分标准-(平台级)
var ScoringCriteriaSchema = mongoose.Schema({
    sc_name: { //标准名称
        type: String,
    },
    sc_description: { //标准描述
        type: String,
    },
})
ScoringCriteriaSchema.plugin(valid);

ScoringCriteriaSchema.index({
    sc_name: 1,
}, {
    unique: true,
    dropDups: true
}); //定义复合索引——唯一键

module.exports.ScoringCriteriaSchema = ScoringCriteriaSchema;
//目标分类-平台级
var ObjectiveCategorySchema = mongoose.Schema({
    oc_name: String, //分类名称，支持多语言
    oc_description: String //分类描述
});
ObjectiveCategorySchema.plugin(valid);
ObjectiveCategorySchema.index({
    oc_name: 1
}, {
    unique: true,
    dropDups: true
}); //定义复合索引——唯一键
module.exports.ObjectiveCategorySchema = ObjectiveCategorySchema;

//目标库－平台级
var ObjectiveLibraryPlatformSchema = mongoose.Schema({
    ol_name: { //目标名称
        type: String,
        required: true
    },
    ol_view: { //目标视角
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Viewport',
        required: true
    },
    ol_tags: { //目标标签
        type: String,
    },
    ol_type: { //目标类型
        type: String,
    },
    ol_description: String, //描述
    unit: String, //单位
    parent_ols: [{ //支撑的目标库集
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ObjectiveLibraryPlatform'
    }],
    industries: [ //行业
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Industry'
        }
    ],
    pis: [{ //衡量指标
        type: mongoose.Schema.Types.ObjectId,
        ref: 'PerformanceIndicatorClient',
    }],
    ref_num: { //本目标被使用的次数（每出现在目标计划中一次，这个值就加1），通过后台程序统计后更新这个值。
        type: Number,
        default: 0
    }

})
ObjectiveLibraryPlatformSchema.plugin(valid);
module.exports.ObjectiveLibraryPlatformSchema = ObjectiveLibraryPlatformSchema;

//目标库－客户级
var ObjectiveLibrarySchema = mongoose.Schema({
    client: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Client'
    },
    company: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Company',
    },
    ol_name: { //目标名称
        type: String,
        required: true
    },
    ol_view: { //目标视角
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Viewport',
        required: true
    },
    ol_tags: { //目标标签
        type: String,
    },
    ol_type: { //目标类型
        type: String,
    },
    ol_description: String, //描述
    unit: String, //单位
    // parent_ol: { //-作废
    //     type: mongoose.Schema.Types.ObjectId,
    //     ref: 'ObjectiveLibrary'
    // },
    parent_ols: [{ //支撑的目标库集
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ObjectiveLibrary'
    }],
    companies: [{ //适用公司
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Company',
    }],
    ous: [{ //适用部门
        type: mongoose.Schema.Types.ObjectId,
        ref: 'OrganizationUnit'
    }],
    positions: [{ //适用职位
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Position'
    }],
    pis: [{ //衡量指标
        type: mongoose.Schema.Types.ObjectId,
        ref: 'PerformanceIndicatorClient',
    }],
    source: { //1:个人目标,2:企业目标,3:云目标
        type: String,
        required: true,
        'enum': ['1', '2', '3'],
        default: '1'
    },
    status: { //1:待确认(用户添加),2:已确认为企业目标
        type: String,
        required: true,
        'enum': ['1', '2'],
        default: '1'
    },
    creator: { //本条记录的创建人
        type: mongoose.Schema.Types.ObjectId,
        ref: 'People',
    },
    is_sync: { //用作是否把用户自己添加的ol加入到收藏中
        type: Boolean,
        default: false,
    },
    ref_num: { //本目标被使用的次数（每出现在目标计划中一次，这个值就加1），通过后台程序统计后更新这个值。
        type: Number,
        default: 0
    }

})

ObjectiveLibrarySchema.plugin(valid);
ObjectiveLibrarySchema.index({
    client: 1,
    // company: 1,
    ol_name: 1
}, {
    unique: true,
    dropDups: true
}); //定义复合索引——唯一键

module.exports.ObjectiveLibrarySchema = ObjectiveLibrarySchema;

//目标计划－任务项
var ObjectivePlanSchema = mongoose.Schema({
    client: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Client'
    },
    periodmanagement: { //周期
        type: mongoose.Schema.Types.ObjectId,
        ref: 'PeriodManagement',
    },
    company: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Company',
    },
    ou: { //目标责任部门
        type: mongoose.Schema.Types.ObjectId,
        ref: 'OrganizationUnit',
    },
    position: { //目标责任职位
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Position',
    },
    people: { //目标责任人 
        type: mongoose.Schema.Types.ObjectId,
        ref: 'People',
    },
    year: String, //年度
    period_type: String, //周期类型，与pm里的period_value定义一致
    period_value: Number, //对应的周期数据。年度类型的写0（查询取year），季度和月度的从0开始。季度0，1，2，3；月度0～11.
    people_name: String,
    position_name: String,
    op_name: { //目标计划名称，人名－期间－工作计划
        type: String,
        required: true
    },
    op_score: { //计划得分
        type: Number,
        default: 0
    },
    op_percent_complete: { //完成百分比－任务部分，根据下面的任务和权重加权平均求得
        type: Number,
        default: 0
    },
    op_status: { // '计划中-未提交', '计划中-已提交', '已确认-待执行', '执行中', '变更中', '已到期', '已评分', '已冻结'
        type: String,
        'enum': ['0', '1', '2', '3', '4', '5', '6', '7'],
        default: '0'
    },
    last_op_status: { // 用于处理解冻的时候，恢复到冻结前的状态。
        type: String,
        'enum': ['0', '1', '2', '3', '4', '5', '6', '7'],
        default: '0'
    },
    op_status_change_reason: [ //计划状态的更改原因, 每做一次更改都写入一条数据。
        {
            people: { //更改人
                type: mongoose.Schema.Types.ObjectId,
                ref: 'People',
            },
            change: String, //更改内容： 例如：0->1 代表由“计划中－未提交”更改为“计划中－已提交”
            reason: String, //更改原因
            timestamp: Date, //时间戳
        },
    ],
    wfs: { //流程实例集锦
        ObjectivePlan01: [{ //审批流程
            type: mongoose.Schema.Types.ObjectId,
            ref: 'ProcessInstance',
        }],
        ObjectivePlan02: [{ //变更流程
            type: mongoose.Schema.Types.ObjectId,
            ref: 'ProcessInstance',
        }],
    },
    statistics: { //针对目标计划的统计数据
        vps: [ //对viewport的统计－一共4个视角
            {
                vp: { //视角
                    type: mongoose.Schema.Types.ObjectId,
                    ref: 'Viewport',
                },
                weight: Number, //视角所占的权重
                score_a: Number, //视角的得分-绝对分
                score_r: Number, //视角的得分-相对分
                percent_complete: Number, //视角的完成度，由该视角下的目标进度与权重加权求得
                ol_num: Number, //目标的数量
            },
        ],
        history_score: [{ //历史得分。对于年度计划，向前推3年；对于半年计划，向前推6个半年；对于季度计划，向前推6个季度；对于月度计划，向前推18个月。前面没有数据的不写。
            period: String, //为了显示tooltip
            value: Number,
        }]
    },
    items: [ //计划的具体内容－行项目
        {
            ol: { //目标（任务）- ol_name 作为标题, 只能出现一次。
                type: mongoose.Schema.Types.ObjectId,
                ref: 'ObjectiveLibrary',
                required: true,
            },
            origin: { //来源 自建 上级派发 取至上级
                type: String,
                enmu: ['0', '1', '2'],
                default: '0'
            },
            time_series: Boolean, //是否从上一层的周期分解过来
            parent_ol: { //同构面的目标分解关系：支撑的目标库，一对多的支撑：同样的ol，不同的parent_ol,后面的值都是独立的。对于parent_ol=null的，视为本计划中的跟目标，直接接到视角上。
                type: mongoose.Schema.Types.ObjectId,
                ref: 'ObjectiveLibrary'
            },
            support_ols: [{ //跨构面的目标支撑关系，只对目标有效, 可以同时支撑多个
                type: mongoose.Schema.Types.ObjectId,
                ref: 'ObjectiveLibrary'
            }],
            force_break_down: { //当目标由上级派发时，可以指定下属是否必须对这个目标进行分解的操作，即在下属的目标计划里面必须存在已这个目标做为parent的ol
                type: Boolean,
                default: false
            },
            importance: { //重要度 1～5（如果是上级分解下来的，不可改）特别重要 很重要 重要 比较重要 一般
                type: Number,
                default: 3
            },
            urgency: { //紧迫度 1～5（如果是上级分解下来的，不可改）特别紧迫 很紧迫 紧迫 比较紧迫 一般
                type: Number,
                default: 3
            },
            weight: { //权重（如果是上级分解下来的，不可改）
                type: Number,
                required: true,
                default: 0
            },

            value: { //设定分解下来的数值－通过单独的功能来实现（上级往下分解时写这个字段，如果是上级分解下来的，不可改）
                type: Number,
                default: 0
            },
            unit: { //目标的单位，直接保存单位名称，转换通过名称去查询, 默认给一个百分号
                type: String,
                default: '%'
                // ref: 'IndexUnit',
            },

            actual_value: { //实际值
                type: Number,
                default: 0
            },
            actual_value_revise: [{ //实际值修改的历史记录
                revised_value: String, //值
                timestamp: Date, //时间戳
            }],
            achieve_possibility: { //目标达成的可能性 低－红色 中－黄色 高－绿色
                type: String,
                'enum': ['0', '1', '2'],
                default: '1'
            },
            pis: [{
                pi: { //衡量指标－默认从目标库的设定中带出来，用户可以手工修改
                    type: mongoose.Schema.Types.ObjectId,
                    ref: 'PerformanceIndicatorClient',
                },
                pi_unit: String, //与pi的index_unit_name同步一致

                weight: { //用于当期考核时占比的权重
                    type: Number,
                    default: 100
                },
                for_assessment: { //是否用于当期考核
                    type: Boolean,
                    default: true
                },
                target_value: { //目标值
                    type: String,
                    default: 0
                },
                actual_value: { //实际值
                    type: String,
                    default: 0
                },
                score: { //得分
                    type: Number,
                    default: 0
                },
                actionplans: [{ //行动方案
                    type: mongoose.Schema.Types.ObjectId,
                    ref: 'ActionPlan',
                }]
            }],
            opi_score: { //目标得分－考核后回算的得分
                type: Number,
                default: 0
            },
            opi_score_revise: [{ //目标得分的历史记录
                revised_value: Number, //值
                timestamp: Date, //时间戳
            }],
            start_p: Date, //开始日期－计划
            end_p: Date, //结束日期－计划
            start_a: Date, //开始日期－实际
            end_a: Date, //结束日期－实际
            percent_complete: { //完成百分比
                type: Number,
                default: 0
            },
            opi_status: { // 计划中 已批准 变更中 已停止 -- 审批的时候单条确认
                type: String,
                'enum': ['0', '1', '2', '3'],
                default: '0'
            },
            comments: [ //单条沟通的记录
                {
                    people: { //人
                        type: mongoose.Schema.Types.ObjectId,
                        ref: 'People',
                    },
                    message: String, //消息
                    post_time: Date, //时间
                },
            ],
            resource_people: String, //所需资源－人力
            resource_fund: String, //所需资源－财务
            resource_material: String, //所需资源－物资
            resource_policy: String, //所需资源－政策
            attachments: [{ //任务目标的附件。 只有自己传的才能删除，否则只能查看。做目标分解是自动带过来。
                file: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: 'GridFile'
                },
                people: {
                    type: mongoose.Schema.Types.ObjectId, //当前上传的人
                    ref: 'People'
                },
            }],
            objective_meetings: [{ // 对这个目标开过的会议
                type: mongoose.Schema.Types.ObjectId, //
                ref: 'ObjectiveMeeting'
            }, ],
            revise_history: [] //修改历史
        },
    ],

    versions: [{ //变更的历史版本
        version: { //版本，考虑用时间来确定
            type: String,
        },
        status: { //一般只有一个处于open状态的变更版本，当变更流程结束后，将这个open版本的记录改为close。
            type: String,
            'enum': ['open', 'close'],
            default: 'open'
        },
        pi: { //对应的流程id，启动变更流程后，将流程实例id放到这里
            type: mongoose.Schema.Types.ObjectId,
            ref: 'ProcessInstance',
        },
        items: [ //计划的具体内容－行项目－变更内容写在这里
            {
                change_type: { //变更类型 内容变更，新增目标，删除目标（opi_status->3）
                    type: String,
                    'enum': ['1', '2', '3']
                },
                vp: { //所属的视角
                    type: mongoose.Schema.Types.ObjectId,
                    ref: 'Viewport',
                },
                ol: { //目标（任务）- ol_name 作为标题, 只能出现一次。
                    type: mongoose.Schema.Types.ObjectId,
                    ref: 'ObjectiveLibrary',
                    required: true,
                },
                ol_name: String,
                parent_ol: { //同构面的目标分解关系：支撑的目标库，一对多的支撑：同样的ol，不同的parent_ol,后面的值都是独立的。对于parent_ol=null的，视为本计划中的跟目标，直接接到视角上。
                    type: mongoose.Schema.Types.ObjectId,
                    ref: 'ObjectiveLibrary'
                },
                importance: { //重要度 1～5（如果是上级分解下来的，不可改）特别重要 很重要 重要 比较重要 一般
                    type: Number,
                    default: 3
                },
                urgency: { //紧迫度 1～5（如果是上级分解下来的，不可改）特别紧迫 很紧迫 紧迫 比较紧迫 一般
                    type: Number,
                    default: 3
                },
                weight: { //权重（如果是上级分解下来的，不可改）
                    type: Number,
                    required: true,
                    default: 0
                },
                value: { //设定分解下来的数值－通过单独的功能来实现（上级往下分解时写这个字段，如果是上级分解下来的，不可改）
                    type: Number,
                    default: 0
                },
                unit: { //目标的单位，直接保存单位名称，转换通过名称去查询
                    type: String,
                    // ref: 'IndexUnit',
                },
                pis: [{
                    pi: { //衡量指标－默认从目标库的设定中带出来，用户可以手工修改
                        type: mongoose.Schema.Types.ObjectId,
                        ref: 'PerformanceIndicatorClient',
                    },
                    pi_name: String, //pi的名字，方便显示用途
                    pi_unit: String, //与pi的index_unit_name同步一致
                    scoringformula: { //计分公式
                        type: mongoose.Schema.Types.ObjectId,
                        ref: 'ScoringFormula',
                    },
                    weight: { //用于当期考核时占比的权重
                        type: Number,
                        default: 100
                    },
                    for_assessment: { //是否用于当期考核
                        type: Boolean,
                        default: true
                    },
                    target_value: { //目标值
                        type: String,
                        default: 0
                    },
                    actual_value: { //实际值
                        type: String,
                        default: 0
                    },
                    score: { //得分
                        type: Number,
                        default: 0
                    },
                    actionplans: [{ //行动方案
                        type: mongoose.Schema.Types.ObjectId,
                        ref: 'ActionPlan',
                    }]
                }],

                start_p: Date, //开始日期－计划
                end_p: Date, //结束日期－计划
            },
        ]
    }],
})

ObjectivePlanSchema.plugin(valid);
ObjectivePlanSchema.index({
    client: 1,
    periodmanagement: 1,
    company: 1,
    ou: 1,
    position: 1,
    people: 1,
    op_name: 1
}, {
    unique: true,
    dropDups: true
}); //定义复合索引——唯一键

module.exports.ObjectivePlanSchema = ObjectivePlanSchema;
// 目标计划与考核实力的数据交换中间表－
var OPAISchema = mongoose.Schema({
    client: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Client'
    },
    periodmanagement: { //周期
        type: mongoose.Schema.Types.ObjectId,
        ref: 'PeriodManagement',
    },
    company: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Company',
    },
    ou: { //目标责任部门
        type: mongoose.Schema.Types.ObjectId,
        ref: 'OrganizationUnit',
    },
    position: { //目标责任职位
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Position',
    },
    people: { //目标责任人 
        type: mongoose.Schema.Types.ObjectId,
        ref: 'People',
    },
    op_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ObjectivePlan'
    },
    op_status: { // '计划中-未提交', '计划中-已提交', '已确认-待执行', '执行中', '变更中', '已到期', '已评分', '已冻结'
        type: String,
        'enum': ['0', '1', '2', '3', '4', '5', '6', '7'],
        default: '0'
    },
    ai_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'AssessmentInstance'
    },
    ai_status: { //1:发布计划,2:计划中_待提交,3:计划中_待审批,4:计划中_已确认,5:考核数据收集中,6:发布考核,7:考核中_待提交,8:考核中_待审批,9:考核中_已确认,10:绩效总结,11:绩效面谈,12:绩效申诉,99:作废
        type: String,
        'enum': ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13', '14', '99'],
    },
    items: [ //行项目－目标对应的指标 
        {
            ol: { //目标（任务）- ol_name 作为标题, 只能出现一次。
                type: mongoose.Schema.Types.ObjectId,
                ref: 'ObjectiveLibrary',
            },
            ol_name: String, //方便读取
            pi: { //衡量指标－默认从目标库的设定中带出来，用户可以手工修改
                type: mongoose.Schema.Types.ObjectId,
                ref: 'PerformanceIndicatorClient',
            },
            pi_name: String, //方便读取
            pi_unit: String, //与pi的index_unit_name同步一致
            ration: String, //定量或定性的标记，与pi的ration保持同步一致
            scoringformula: { //计分公式
                type: mongoose.Schema.Types.ObjectId,
                ref: 'ScoringFormula',
            },
            ol_weight: Number, //目标的权重
            pi_weight: Number, //目标对应指标的权重
            target_value: { //目标值
                type: Number,
                default: 0
            },
            actual_value: { //实际值
                type: Number,
                default: 0
            },
            score: { //得分-从考核合同中记分值过来（定量对应f_score， 定性对应）
                type: Number,
                default: 0
            },
            actionplans: [{ //行动方案
                type: mongoose.Schema.Types.ObjectId,
                ref: 'ActionPlan',
            }],
            status: { //状态, 0:新增加的或内容有变更的（主要是目标值） 1:已经采用到绩效合同 2:已打分 3:标记为已在目标计划中删除
                type: String,
                emun: ['0', '1', '2', '3'],
                default: '0',
            }
        },
    ]
});
OPAISchema.plugin(valid);
module.exports.OPAISchema = OPAISchema;

// 我关注的目标
var ObjectivesOfMyConcernedSchema = mongoose.Schema({
    client: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Client'
    },
    people: { //关注人
        type: mongoose.Schema.Types.ObjectId,
        ref: 'People'
    },
    p: { //被关注人
        type: mongoose.Schema.Types.ObjectId,
        ref: 'People'
    },
    pos: { //被关注人的职位
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Position'
    },
    m: { //被关注周期
        type: mongoose.Schema.Types.ObjectId,
        ref: 'PeriodManagement'
    },
    o: { //被关注目标
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ObjectiveLibrary'
    },
});
module.exports.ObjectivesOfMyConcernedSchema = ObjectivesOfMyConcernedSchema;

//目标会议
var ObjectiveMeetingSchema = mongoose.Schema({
    client: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Client'
    },
    topic: { //会议主题
        type: String,
        required: true,
    },

    host: { //主持人-发起人
        type: mongoose.Schema.Types.ObjectId,
        ref: 'People'
    },

    fromDate: { //开始时间
        type: Date,
        required: true
    },
    toDate: { //结束时间
        type: Date,
        required: true
    },
    place: String, //开会地点
    attendees: [ //与会者－必选的（自动从议程里面的people带过来）
        {
            people: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'People'
            },
            atype: Number, // 0:必须参加， 1:可选参加（可以有删除按钮）
            status: { //状态，0:未确认，1:已确认，2:已拒绝
                type: String,
                'enum': ['0', '1', '2'],
                default: '0'
            },
            ptype: { //参会人员身份，0:普通参会者，1:现场主持人，2:书记员
                type: String,
                'enum': ['0', '1', '2'],
                default: '0'
            },
            is_host: Boolean,
            is_recorder: Boolean,
            status_comment: String, //如果拒绝，需要填写原因
            status_date: Date, //动作的时间戳
            check_in: Date, //签到时间。如果没有，则代表没有参会--由主持人在开会的时候进行签到确认
        },
    ],
    agenda: [ //会议议程
        {
            people: { //人
                type: mongoose.Schema.Types.ObjectId,
                ref: 'People'
            },
            position: { //人
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Position'
            },
            periodmanagement: { //周期
                type: mongoose.Schema.Types.ObjectId,
                ref: 'PeriodManagement',
            },
            ol: { //目标（任务）- 
                type: mongoose.Schema.Types.ObjectId,
                ref: 'ObjectiveLibrary',
            },
        }
    ],
    comment: String, //会议备注，创建会议的时候写的。
    attachments: [ //会议相关的附件。
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'GridFile'
        },
    ],
    status: { //会议的状态。 0:草稿 1:已发布 2:进行中 3:已结束 9:作废
        type: String,
        'enum': ['0', '1', '2', '3', '9'],
        default: '0'
    },
    summary: String, //会议纪要
    summary_lastupdate: Date, //会议纪要的最后更新时间戳

});

module.exports.ObjectiveMeetingSchema = ObjectiveMeetingSchema;

// 行动计划（方案）－项目管理
var ActionPlanSchema = mongoose.Schema({
    client: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Client'
    },
    ap_name: { //计划名称
        type: String,
        required: true,
    },
    apFrom: { //开始时间
        type: Date,
        required: true,
    },
    apTo: { //结束时间
        type: Date,
        required: true,
    },
    ap_dds: { //天数
        type: Number,
        default: 0
    },
    ap_pm: { //责任人－项目经理
        type: mongoose.Schema.Types.ObjectId,
        ref: 'People'
    },
    ap_creator: { //创建人－一旦创建，不可更改
        type: mongoose.Schema.Types.ObjectId,
        ref: 'People'
    },
    importance: { //重要度 1～5 特别重要 很重要 重要 比较重要 一般
        type: Number,
        default: 3
    },
    urgency: { //紧迫度 1～5 特别紧迫 很紧迫 紧迫 比较紧迫 一般
        type: Number,
        default: 3
    },
    percent_complete: { //完成百分比
        type: Number,
        default: 0
    },
    amount_cost: { //完成百分比
        type: Number,
        default: 0
    },
    amount_target: { //完成百分比
        type: Number,
        default: 0
    },
    attachments: [{ //附件。 
        file: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'GridFile'
        },
        people: {
            type: mongoose.Schema.Types.ObjectId, //当前上传的人
            ref: 'People'
        },
    }],
    comment: String, //文本备注信息
    status: { //状态
        type: String,
        'enum': ['0', '1', '2'],
        default: '0'
    },
    modify_history: [{ //字段修改记录
        field: String, //字段名称－中文，如果是删除任务项，写入 删除任务项－<任务项名称>
        old_value: String, //原来的值
        new_value: String, //新值
        people_name: String, //修改人的姓名
        timestamp: Date, //修改时的时间，取系统时间
        reason: String //修改原因－主要用来保存删除某任务项的时候写入的原因。
    }],
    tms: [{ //项目成员
        type: mongoose.Schema.Types.ObjectId,
        ref: 'People',
    }],
    ops: [{ //后台程序去计算
        op: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'ObjectivePlan'
        },
        ol: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'ObjectiveLibrary'
        },
        pi: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'PerformanceIndicatorClient'
        }
    }],
    items: [ //任务项
        {
            task_no: String, //任务编号，从1开始编，按顺序
            task_pno: String, //上级任务编号，为null的是跟任务。可以有多个null的存在。不为null时，应该是task_no。
            task_name: String, //任务名称
            tm: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'People',
            },
            tms: [{ //任务成员
                type: mongoose.Schema.Types.ObjectId,
                ref: 'People',
            }],
            start_p: Date, //开始日期－计划
            end_p: Date, //结束日期－计划
            // start_a: Date, //开始日期－实际
            // end_a: Date, //结束日期－实际
            percent_complete: { //完成百分比
                type: Number,
                default: 0
            },
            percent_complete_revise: [{ //完成百分比修改的历史记录
                revised_value: String, //值
                timestamp: Date, //时间戳
            }],
            node_type: {
                type: String,
                default: 'L'
            },
            favorite: { //是否属于关注的重点任务
                type: Boolean,
            },
            status: { //状态 未开始，进行中，已完成
                type: String,
                'enum': ['0', '1', '2'],
                default: '0'
            },
            sync2workplan: { //是否同步到相关人员的工作计划中
                type: Boolean,
                default: true
            },
            comments: [ //单条沟通的记录
                {
                    people: { //人
                        type: mongoose.Schema.Types.ObjectId,
                        ref: 'People',
                    },
                    message: String, //消息
                    post_time: Date, //时间
                },
            ],
            modify_history: [{ //字段修改记录
                field: String, //字段名称－中文
                old_value: String, //原来的值
                new_value: String, //新值
                people_name: String, //修改人的姓名
                timestamp: Date, //修改时的时间，取系统时间
                reason: String //修改原因－主要用来保存删除某任务项的时候写入的原因。
            }],
        },
    ],
})
ActionPlanSchema.plugin(valid);
module.exports.ActionPlanSchema = ActionPlanSchema;

// 个人工作计划－个人管理
var WorkPlanSchema = mongoose.Schema({
    client: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Client'
    },
    people: { //任务的所有人－默认是系统登录用户，当为别人创建时，则是指定的人员
        type: mongoose.Schema.Types.ObjectId,
        ref: 'People'
    },
    creator: { //创建人－系统登录用户
        type: mongoose.Schema.Types.ObjectId,
        ref: 'People'
    },
    title: String, //任务名称
    tags: String, //标签
    start: Date, //开始日期－精确到时间
    end: Date, //结束日期－精确到时间
    stype: { //类型 task:任务 summary;总结
        type: String,
        enum: ['TASK', 'SUMMARY'],
        default: 'TASK'
    },
    allDay: Boolean, //是否属于全天任务
    url: String, //其他系统建立的任务，如果需要导航回去的话，就写这个url。
    className: String,
    editable: Boolean,
    startEditable: Boolean,
    durationEditable: Boolean,
    is_complete: Boolean, //是否完成的标记
    backgroundColor: String,
    borderColor: String,
    textColor: String,
    origin: { //来源 0:自己建立的 1:行动计划同步过来的 2:目标会议 3:他人转发  －－ 以后可以根据情况再加
        type: String,
        'enum': ['0', '1', '2', '3', '4'],
        default: '0'
    },
    origin_oid: { //对于不同来源的oid，用来进行同步任务的时候使用。同步的时候先查找并删除未完成的任务，插入新任务。
        type: mongoose.Schema.Types.ObjectId,
    },
    origin_cat: { //来源的分类，默认是default。用来表示出同一个oid对应不同分类的任务。
        type: String,
        default: 'default'
    },
    description: String,
    location: String, //地点
    comments: String, //用作描述或个人评分
    rank: { //个人评分
        type: Number,
        default: 0
    },
    scomments: String, //上级评语
    srank: { //上级评分
        type: Number,
        default: 0
    },
    attachments: [{ //附件
        type: mongoose.Schema.Types.ObjectId,
        ref: 'GridFile'
    }],
    summary_status: { //工作总结的状态 0:起草 1:提交领导批准 2:领导批准完成
        type: String,
        'enum': ['0', '1', '2'],
        default: '0'
    },
    forward_people: [{ //转发的对象
        type: mongoose.Schema.Types.ObjectId,
        ref: 'People'
    }],
})
WorkPlanSchema.plugin(valid);
module.exports.WorkPlanSchema = WorkPlanSchema;



//题库-平台级
var QuestionBankSchema = mongoose.Schema({
    qb_name: { //题目名称
        type: String,
        required: true
    },
    qb_category: { //题目类别
        type: mongoose.Schema.Types.ObjectId,
        ref: 'TopicCategory'
    },
    qb_rule: String, //评分标准
    apply_to_questionnair: [{ //问卷类别:1.360考核问卷;2.360人才盘点问卷;3.选项问卷(计分统计);4.选项问卷(选项统计);5.评分问卷;6.问答问卷;7.360单独考核
        type: String,
        'enum': ['1', '2', '3', '4', '5', '6', '7'],
    }],
    frequency_of_usage: { //使用频次
        type: Number,
        default: 0
    }
})

QuestionBankSchema.plugin(valid);

QuestionBankSchema.index({
    qb_name: 1,
    qb_category: 1
}, {
    unique: true,
    dropDups: true
}); //定义复合索引——唯一键

module.exports.QuestionBankSchema = QuestionBankSchema;

//题库-客户级
var QuestionBankClientSchema = mongoose.Schema({
    client: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Client'
    },
    qb_name: { //题目名称
        type: String,
        required: true
    },
    qb_category: { //题目类别
        type: mongoose.Schema.Types.ObjectId,
        ref: 'TopicCategoryClient'
    },
    qb_rule: String, //评分标准
    apply_to_questionnair: [{ //问卷类别:1.360考核问卷;2.360人才盘点问卷;3.选项问卷(计分统计);4.选项问卷(选项统计);5.评分问卷;6.问答问卷;7.360单独考核
        type: String,
        'enum': ['1', '2', '3', '4', '5', '6', '7'],
    }],
    frequency_of_usage: { //使用频次
        type: Number,
        default: 0
    }
})

QuestionBankClientSchema.plugin(valid);

QuestionBankClientSchema.index({
    client: 1,
    qb_name: 1,
    qb_category: 1
}, {
    unique: true,
    dropDups: true
}); //定义复合索引——唯一键

module.exports.QuestionBankClientSchema = QuestionBankClientSchema;

//指标库
var PerformanceIndicatorClientSchema = mongoose.Schema({
    client: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Client'
    },
    company: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Company',
    },
    management_functions: [{ //所属管理职能
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ManagementFunction',
        //required: true
    }],
    pi_name: { //指标名称
        type: String,
        required: true
    },
    viewport: { //绩效视角
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Viewport',
        required: true
    },
    pi_type: { //指标分类
        type: mongoose.Schema.Types.ObjectId,
        ref: 'IndexType',
    },
    pi_tags: { //指标标签
        type: String,
    },
    index_equation: { //指标公式
        type: String
    },
    pi_unit: { //单位
        type: String,
        //ref: 'IndexUnit',
    },
    //pi_unit_name: String, //需要在选好单位的时候同时把名字带进来
    pi_description: { //指标描述
        type: String
    },
    sfs: [{ //适用的计分公式
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ScoringFormulaClient'
    }],
    ols: [{ //支撑的目标集
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ObjectiveLibrary'
    }],
    ous: [{ //适用部门
        type: mongoose.Schema.Types.ObjectId,
        ref: 'OrganizationUnit'
    }],
    dp_source: { //数据提供来源:1 系统内部;2 系统外部
        type: String,
        required: true,
        'enum': ['1', '2'],
        default: '1',
    },
    dp_source_name: String, //数据提供源名称--dp_source为2时
    dp_ous: [{ //数据提供部门
        type: mongoose.Schema.Types.ObjectId,
        ref: 'OrganizationUnit'
    }, ],
    dp_peoples: [{ //数据提供人
        type: mongoose.Schema.Types.ObjectId,
        ref: 'People'
    }, ],
    // ols: [{ //支撑的目标集
    //     type: mongoose.Schema.Types.ObjectId,
    //     ref: 'ObjectiveLibrary'
    // }],
    // //适用周期
    // apply_to_periods: [{ //1:年,2:半年,3:季，4:月，5:周
    //     type: String,
    //     uppercase: true,
    //     'enum': ['1', '2', '3', '4', '5']
    // }],

    assessment_purpose: String, //考核目的
    // scoring_criteria: String, //评分标准---作废,改成多条
    scoring_criteria: [{
        sc_name: {
            type: String,
            // required: true,
        },
        sc_description: {
            type: String,
            // required: true,
        },
    }],
    source: { //1:个人指标,2:企业指标,3:云指标
        type: String,
        required: true,
        'enum': ['1', '2', '3'],
    },
    status: { //1:待确认(用户添加),2:已确认为企业指标
        type: String,
        required: true,
        'enum': ['1', '2'],
    },
    ration: {
        type: String,
        'enum': ['1', '2'], //'1:定性', '2:定量'
        default: '2',
    },
    lead: {
        type: String,
        'enum': ['1', '2'], //'1:领先', '2:滞后'
        default: '1',
    },
    result: {
        type: String,
        'enum': ['1', '2'], //'1:结果', '2:驱动'
        default: '1',
    },
    indicator: {
        type: String,
        'enum': ['1', '2', '3', '4'], //'1:越高越好', '2:越低越好', '3:越靠近区间越好', '4:非零即满'
        default: '1',
    },
    inout: {
        type: String,
        'enum': ['1', '2'], //'1:内部', '2:外部'
        default: '1',
    },
    important: {
        type: String,
        'enum': ['1', '2', '3'], //'1:高', '2:中', '3:低'
        default: '2',
    },
    enforceable: {
        type: String,
        'enum': ['1', '2', '3'], //'1:高', '2:中', '3:低'
        default: '2',
    },
    access: {
        type: String,
        'enum': ['1', '2', '3'], //'1:高', '2:中', '3:低'
        default: '3',
    },
    control: {
        type: String,
        'enum': ['1', '2', '3'], //'1:高', '2:中', '3:低'
        default: '2',
    },
    formula_type: { //公式类型
        type: String,
        'enum': ['1', '2', '3', '4', '5'], //'1:越高越好', '2:越低越好', '3:越靠近区间越好', '4:超出扣分', '5:非零即满分'
        default: '1',
    },
    creator: { //本条记录的创建人
        type: mongoose.Schema.Types.ObjectId,
        ref: 'People',
    },
    is_sync: {
        type: Boolean,
        default: false,
    },
    ref_num: { //本指标被使用的次数（每出现在绩效实例一次，这个值就加1）
        type: Number,
        default: 0
    }
})

PerformanceIndicatorClientSchema.plugin(valid);

PerformanceIndicatorClientSchema.index({
    client: 1,
    pi_name: 1
}, {
    unique: true,
    dropDups: true
}); //定义复合索引——唯一键

module.exports.PerformanceIndicatorClientSchema = PerformanceIndicatorClientSchema;

//绩效合同 
var AssessmentInstanceSchema = mongoose.Schema({
    client: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Client',
    },
    company: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Company',
    },
    company_name: String,
    template: { //绩效模板-记录id,通过该id取出对应配置的360考核问卷
        type: mongoose.Schema.Types.ObjectId,
        ref: 'PMTemplate',
    },
    tb_name: String,
    people: { //被考核人 
        type: mongoose.Schema.Types.ObjectId,
        ref: 'People',
    },
    people_no: String,
    people_name: String,
    ou: { //被考核人部门
        type: mongoose.Schema.Types.ObjectId,
        ref: 'OrganizationUnit',
    },
    ou_name: String,
    position: { //被考核人职位
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Position',
    },
    position_name: String,
    position_is_main: {
        type: Boolean,
        default: true,
    },
    joblevel: { //职位层级
        type: mongoose.Schema.Types.ObjectId,
        ref: 'JobLevel',
    },
    joblevel_name: String, //层级
    jobrank: { //职位等级
        type: mongoose.Schema.Types.ObjectId,
        ref: 'JobRank',
    },
    jobrank_name: String, //职级
    position_manager: { //该职位是否是隶属组织单元的管理者职位（控制权限，业务流程）
        type: Boolean,
    },
    position_is_knowledge: { //是否属于知识型的职位
        type: Boolean,
    },
    position_is_key: Boolean, //关键岗位表识
    has_parttime_positions: Boolean, //是否有兼职
    employee_status: {
        type: String,
        required: true,
        'enum': ['P', 'H', 'L', 'R'],
        // 'H':'Hire'  //正式雇佣状态
        // 'P':'Probationary period'  //试用期状态
        // 'R':'Resignation' //已离职状态
        // 'L':'Leave without pay' //停薪留职状态
        default: 'P'
    },
    period: { //周期(考核期间)
        type: mongoose.Schema.Types.ObjectId,
        ref: 'PeriodManagement',
    },
    period_name: String,
    periodFrom: { //周期开始
        type: Date,
        // required: true,
    },
    periodTo: { //周期结束
        type: Date,
        // required: true,
    },
    year: {
        type: String,
    },
    period_type: { //1:年,2:半年,3:季，4:月，5:周
        type: String,
        uppercase: true,
        'enum': ['1', '2', '3', '4', '5']
    },
    period_value: Number, //周期值；从0开始，如一月，一季度为0；二月，二季度为1；递增
    is_forced: {
        type: Boolean,
        default: false
    },
    if_changed: {
        type: Boolean,
        default: false
    },
    points_system: { //分制
        type: mongoose.Schema.Types.ObjectId,
        ref: 'PointsSystemClient',
        //required: true
    },
    sum_rule: { //W:加权求和,A:算术平均,P:算术乘积
        type: String,
        //required: true,
        uppercase: true,
        'enum': ['W', 'A', 'P']
    },
    ai_name: { //实例名称
        type: String,
        required: true,
    },
    undo_reason: String, //重新发布原因
    is_unread: { //是否未读
        type: Boolean,
        required: true,
        default: false,
    },
    ai_status: { //1:发布计划,2:计划中_待提交,3:计划中_待审批,4:计划中_已确认,5:考核数据收集中,6:发布考核,7:考核中_待提交,8:考核中_待审批,9:考核中_已确认,10:绩效总结_进行中,11:绩效总结_已完成,12:绩效面谈_进行中,13:绩效面谈_已完成
        type: String,
        required: true,
        'enum': ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13'],
        default: '1'
    },
    appeal_status: { //0:无申诉,1:申诉中,2:申诉结束－未改分, 3:已改分
        type: String,
        required: true,
        'enum': ['0', '1', '2', '3'],
        default: '0',
    },
    ai_op_status: { //1:无目标计划,2:有目标计划(已同步指标),3:有目标计划(未同步指标)
        type: String,
        required: true,
        'enum': ['1', '2', '3'],
        default: '1',
    },
    ai_op_status_name: { //1:无,2:有-已同步,3:有-未同步
        type: String,
        required: true,
        default: '无',
    },
    ai_score: {
        type: Number,
        default: 0
    },
    ai_grade: String, //绩效等级
    ai_forced_distribution_grade: String, //强制分布等级
    performance_rank: String, //部门绩效排名
    //意见/评语
    ai_comments: [{
        comment: String, //意见内容
        createDate: { //创建日期
            type: Date,
            default: new Date()
        },
        creator: { //记录的创建人
            type: mongoose.Schema.Types.ObjectId,
            ref: 'People',
        }
    }],
    //定量指标项
    quantitative_pis: {
        is_assess: { //该项是否存在考核//该项是否存在考核
            type: Boolean,
            default: false,
        },
        sum_rule: { //W:加权求和,A:算术平均,P:算术乘积
            type: String,
            // required: true,
            uppercase: true,
            'enum': ['W', 'A', 'P']
        },
        greater_or_less: String, //大于等于'G', 小于等于'L'
        weight_t: Number, //模板带过来的权重
        weight: Number, //实际的权重
        sum_score: { //定量指标总得分
            type: Number,
            default: 0
        },
        items: [{
            pi: { //指标
                type: mongoose.Schema.Types.ObjectId,
                ref: 'PerformanceIndicatorClient',
            },
            ol: { //支撑的目标
                type: mongoose.Schema.Types.ObjectId,
                ref: 'ObjectiveLibrary',
            },
            ol_name: String, //目标名称
            pi_name: String, //指标名称
            pi_source: { //指标来源：1,自己;2,上级分解;3,HR;4,目标计划;5,向上获取
                type: String,
                required: true,
                'enum': ['1', '2', '3', '4', '5'],
                default: '1',
            },
            scoringformula: { //计分公式
                type: mongoose.Schema.Types.ObjectId,
                ref: 'ScoringFormulaClient',
            },
            target_value: Number, //目标值
            unit: String, //目标值单位，直接保存单位名称，转换通过名称去查询
            actual_value: { //实际值
                type: Number,
                default: 0
            },
            actual_value_revise: [{ //实际值修改的历史记录
                revised_value: Number, //值
                timestamp: Date, //时间戳
            }],
            dp_people: { //数据提供人
                type: mongoose.Schema.Types.ObjectId,
                ref: 'People'
            },
            f_score: { //计分--乘以权重之前的分数
                type: Number,
                default: 0
            },
            weight: { //权重
                type: Number
            },
            score: { //指标得分
                type: Number,
                default: 0
            },
            status: { //1:正常,2:驳回
                type: String,
                required: true,
                'enum': ['1', '2'],
                default: '1',
            },
            //意见/评语
            comments: [{
                comment: String, //意见内容
                createDate: { //创建日期
                    type: Date,
                    default: new Date()
                },
                people_name: String,
                position_name: String,
                avatar: { //头像的文件名
                    type: mongoose.Schema.Types.ObjectId,
                    ref: 'GridFile'
                },
                creator: { //记录的创建人
                    type: mongoose.Schema.Types.ObjectId,
                    ref: 'People',
                }
            }, ],
            //过程管理中的总结记录信息
            wip_summary: [{
                gap_analysis: String, //差异分析
                improvement_plan: String, //改进计划
                createDate: { //创建日期
                    type: Date,
                    default: new Date()
                },
                start: { //改进计划的开始日期
                    type: Date,
                },
                end: { //改进计划的截止日期
                    type: Date,
                },
                finished: Boolean, //是否完成，已完成的不能修改，也不能删除。
                comments: [{ //针对每一个分解下来的小周期里面的每一个偏差分析进行的互动交流信息
                    comment: String, //意见内容
                    createDate: { //创建日期
                        type: Date,
                        default: new Date()
                    },
                    people_name: String,
                    position_name: String,
                    avatar: { //头像的文件名
                        type: mongoose.Schema.Types.ObjectId,
                        ref: 'GridFile'
                    },
                    creator: { //记录的创建人
                        type: mongoose.Schema.Types.ObjectId,
                        ref: 'People',
                    }
                }, ],
            }],
            segments_sum_rule: { //小周期实际值的累进规则
                type: String,
                enum: ['S', 'M'],
                default: 'S'
            },
            //过程管理－周期细分－界面上可以预设一些细分的规则，例如：天，周，旬，月
            segments: [{
                segment_name: String, //段的名称
                start: Date, //开始日期
                end: Date, //结束日期
                target_value: { //本段的目标值
                    type: Number,
                    default: 0
                },
                target_value_revise: [{ //目标值修改的历史记录
                    revised_value: String, //值
                    timestamp: Date, //时间戳
                }],
                actual_value: { //本段的实际值
                    type: Number,
                    default: 0
                },
                actual_value_revise: [{ //实际值修改的历史记录
                    revised_value: String, //值
                    timestamp: Date, //时间戳
                }],
                f_score: { //计分--乘以权重之前的分数--记分公式直接输出的值
                    type: Number,
                    default: 0
                },
                score: { //小周期的得分
                    type: Number,
                    default: 0
                },
                state: { //状态 0:变化中 1:领导最终确定实际值－不能再改了
                    type: String,
                    'enum': ['0', '1'],
                    default: '0'
                },
                segment_summary: [{ //对应小周期的过程管理数据
                    gap_analysis: String, //差异分析
                    improvement_plan: String, //改进计划
                    createDate: { //创建日期
                        type: Date,
                        default: new Date()
                    },
                    start: { //改进计划的开始日期
                        type: Date,
                    },
                    end: { //改进计划的截止日期
                        type: Date,
                    },
                    finished: Boolean, //是否完成，已完成的不能修改，也不能删除。
                    comments: [{ //针对每一个分解下来的小周期里面的每一个偏差分析进行的互动交流信息
                        comment: String, //意见内容
                        createDate: { //创建日期
                            type: Date,
                            default: new Date()
                        },
                        people_name: String,
                        position_name: String,
                        avatar: { //头像的文件名
                            type: mongoose.Schema.Types.ObjectId,
                            ref: 'GridFile'
                        },
                        creator: { //记录的创建人
                            type: mongoose.Schema.Types.ObjectId,
                            ref: 'People',
                        }
                    }, ],
                }],
                comments: [{ //针对每一个分解下来的小周期进行的互动交流信息
                    comment: String, //意见内容
                    createDate: { //创建日期
                        type: Date,
                        default: new Date()
                    },
                    people_name: String,
                    position_name: String,
                    avatar: { //头像的文件名
                        type: mongoose.Schema.Types.ObjectId,
                        ref: 'GridFile'
                    },
                    creator: { //记录的创建人
                        type: mongoose.Schema.Types.ObjectId,
                        ref: 'People',
                    }
                }, ],
                //行动计划
                actionplans: [{ //行动方案
                    type: mongoose.Schema.Types.ObjectId,
                    ref: 'ActionPlan',
                }],
            }],
            mark_as_watch: Boolean, //是否标记为本周期重点监控的指标
            mark_as_summary_type1: Boolean, //是否作为总结的指标 1:不足与改进 
            mark_as_summary_type2: Boolean, //是否作为总结的指标 2:亮点分享 
            //行动计划
            actionplans: [{ //行动方案
                type: mongoose.Schema.Types.ObjectId,
                ref: 'ActionPlan',
            }],
            //绩效总结
            summary: {
                // 不足与改进--对应summary type:1
                gap_analysis: { //绩效偏差及需要提升的能力分析
                    self_comment: String, //自评－当事人填写
                    upper_comment: { //领导的意见
                        comment: String, //意见内容
                        createDate: { //创建日期
                            type: Date,
                            default: new Date()
                        },
                        people_name: String,
                        position_name: String,
                        ou_name: String,
                        avatar: { //头像的文件名
                            type: mongoose.Schema.Types.ObjectId,
                            ref: 'GridFile'
                        },
                        creator: { //记录的创建人
                            type: mongoose.Schema.Types.ObjectId,
                            ref: 'People',
                        }
                    },
                    upper2_comment: { //上上级领导的意见
                        comment: String, //意见内容
                        createDate: { //创建日期
                            type: Date,
                            default: new Date()
                        },
                        people_name: String,
                        position_name: String,
                        ou_name: String,
                        avatar: { //头像的文件名
                            type: mongoose.Schema.Types.ObjectId,
                            ref: 'GridFile'
                        },
                        creator: { //记录的创建人
                            type: mongoose.Schema.Types.ObjectId,
                            ref: 'People',
                        }
                    },
                    hr_comment: { //HR的意见
                        comment: String, //意见内容
                        createDate: { //创建日期
                            type: Date,
                            default: new Date()
                        },
                        people_name: String,
                        position_name: String,
                        ou_name: String,
                        avatar: { //头像的文件名
                            type: mongoose.Schema.Types.ObjectId,
                            ref: 'GridFile'
                        },
                        creator: { //记录的创建人
                            type: mongoose.Schema.Types.ObjectId,
                            ref: 'People',
                        }
                    },
                },
                improvement_plan: { //改进措施
                    self_comment: String, //自评－当事人填写
                    upper_comment: { //领导的意见
                        comment: String, //意见内容
                        createDate: { //创建日期
                            type: Date,
                            default: new Date()
                        },
                        people_name: String,
                        position_name: String,
                        ou_name: String,
                        avatar: { //头像的文件名
                            type: mongoose.Schema.Types.ObjectId,
                            ref: 'GridFile'
                        },
                        creator: { //记录的创建人
                            type: mongoose.Schema.Types.ObjectId,
                            ref: 'People',
                        }
                    },
                    upper2_comment: { //上上级领导的意见
                        comment: String, //意见内容
                        createDate: { //创建日期
                            type: Date,
                            default: new Date()
                        },
                        people_name: String,
                        position_name: String,
                        ou_name: String,
                        avatar: { //头像的文件名
                            type: mongoose.Schema.Types.ObjectId,
                            ref: 'GridFile'
                        },
                        creator: { //记录的创建人
                            type: mongoose.Schema.Types.ObjectId,
                            ref: 'People',
                        }
                    },
                    hr_comment: { //HR的意见
                        comment: String, //意见内容
                        createDate: { //创建日期
                            type: Date,
                            default: new Date()
                        },
                        people_name: String,
                        position_name: String,
                        ou_name: String,
                        avatar: { //头像的文件名
                            type: mongoose.Schema.Types.ObjectId,
                            ref: 'GridFile'
                        },
                        creator: { //记录的创建人
                            type: mongoose.Schema.Types.ObjectId,
                            ref: 'People',
                        }
                    },
                },
                mark_as_watch: Boolean, //是否标记为下个周期重点监控的指标
                actionplans: [{ //行动方案-用于下一个周期的改进措施
                    type: mongoose.Schema.Types.ObjectId,
                    ref: 'ActionPlan',
                }],
                // 突出的绩效亮点分享--对应summary type:2
                performance_highlights: { //突出的绩效亮点分享
                    self_comment: String, //自评－当事人填写
                    upper_comment: { //领导的意见
                        comment: String, //意见内容
                        createDate: { //创建日期
                            type: Date,
                            default: new Date()
                        },
                        people_name: String,
                        position_name: String,
                        ou_name: String,
                        avatar: { //头像的文件名
                            type: mongoose.Schema.Types.ObjectId,
                            ref: 'GridFile'
                        },
                        creator: { //记录的创建人
                            type: mongoose.Schema.Types.ObjectId,
                            ref: 'People',
                        }
                    },
                    upper2_comment: { //上上级领导的意见
                        comment: String, //意见内容
                        createDate: { //创建日期
                            type: Date,
                            default: new Date()
                        },
                        people_name: String,
                        position_name: String,
                        ou_name: String,
                        avatar: { //头像的文件名
                            type: mongoose.Schema.Types.ObjectId,
                            ref: 'GridFile'
                        },
                        creator: { //记录的创建人
                            type: mongoose.Schema.Types.ObjectId,
                            ref: 'People',
                        }
                    },
                    hr_comment: { //HR的意见
                        comment: String, //意见内容
                        createDate: { //创建日期
                            type: Date,
                            default: new Date()
                        },
                        people_name: String,
                        position_name: String,
                        ou_name: String,
                        avatar: { //头像的文件名
                            type: mongoose.Schema.Types.ObjectId,
                            ref: 'GridFile'
                        },
                        creator: { //记录的创建人
                            type: mongoose.Schema.Types.ObjectId,
                            ref: 'People',
                        }
                    },
                },
            },
            //绩效申诉
            mark_as_appeal: Boolean, //是否作为申诉的指标 
            appeal: {
                reason: String, //申诉理由
                attachments: [{ //申诉相关附件
                    type: mongoose.Schema.Types.ObjectId,
                    ref: 'GridFile'
                }],
                status: { //申诉状态 0:未确认 1:已接受 2:已拒绝 3:已改分 (在流程中对单个指标的申述进行确认)
                    type: String,
                    'enum': ['0', '1', '2', '3'],
                    default: '0'
                }
            },
            //相关附件
            attachments: [{
                type: mongoose.Schema.Types.ObjectId,
                ref: 'GridFile'
            }],
        }],
        sub_items: [{
            sub_item_name: { //分类名称
                type: String,
            },
            weight: Number, //权重
            score: { //定量指标分类得分
                type: Number,
                default: 0
            },
            items: [{
                pi: { //指标
                    type: mongoose.Schema.Types.ObjectId,
                    ref: 'PerformanceIndicatorClient',
                },
                ol: { //支撑的目标
                    type: mongoose.Schema.Types.ObjectId,
                    ref: 'ObjectiveLibrary',
                },
                pi_source: { //指标来源：1,自己;2,上级分解;3,HR;4,目标计划;5,向上获取
                    type: String,
                    required: true,
                    'enum': ['1', '2', '3', '4', '5'],
                    default: '1',
                },
                scoringformula: { //计分公式
                    type: mongoose.Schema.Types.ObjectId,
                    ref: 'ScoringFormula',
                },
                target_value: Number, //目标值
                actual_value: Number, //实际值
                actual_value_revise: [{ //实际值修改的历史记录
                    revised_value: String, //值
                    timestamp: Date, //时间戳
                }],
                dp_people: { //数据提供人
                    type: mongoose.Schema.Types.ObjectId,
                    ref: 'People'
                },
                score: { //得分
                    type: Number,
                    default: 0
                },
                weight: { //权重
                    type: Number
                },
                status: { //1:正常,2:驳回
                    type: String,
                    'enum': ['1', '2'],
                    default: '1',
                },
                //意见/评语
                comments: [{
                    comment: String, //意见内容
                    createDate: { //创建日期
                        type: Date,
                        default: new Date()
                    },
                    creator: { //记录的创建人
                        type: mongoose.Schema.Types.ObjectId,
                        ref: 'People',
                    }
                }],
            }]
        }]
    },
    //定性指标项
    qualitative_pis: {
        is_assess: { //该项是否存在考核
            type: Boolean,
            default: false,
        },
        sum_rule: { //W:加权求和,A:算术平均,P:算术乘积
            type: String,
            // required: true,
            uppercase: true,
            'enum': ['W', 'A', 'P']
        },
        greater_or_less: String, //大于等于'G', 小于等于'L'
        weight_t: Number, //模板带过来的权重
        weight: Number, //实际的权重
        self_weight: Number, //自评权重
        indirect_weight: Number, //间接上级评分权重
        superior_weight: Number, //直接上级评分权重
        superior_superior_weight: Number, //上上级评分权重
        other_weight: Number, //他评权重
        grade_way: { //P:手工输入分数,G:选择等级打分--适用于定性指标(2)
            type: String,
            uppercase: true,
            'enum': ['P', 'G']
        },
        grade_group: { //等级组--选择按等级打分后--适用于定性指标(2)
            type: mongoose.Schema.Types.ObjectId,
            ref: 'GradeGroup',
        },
        grade_upper: { //手工打分上限
            type: Number,
            required: true,
            default: 100,
        },
        grade_lower: { //手工打分下限
            type: Number,
            required: true,
            default: 0,
        },
        sum_score: { //定性指标总得分
            type: Number,
            default: 0
        },
        items: [{
            pi: { //指标
                type: mongoose.Schema.Types.ObjectId,
                ref: 'PerformanceIndicatorClient',
            },
            ol: { //支撑的目标
                type: mongoose.Schema.Types.ObjectId,
                ref: 'ObjectiveLibrary',
            },
            ol_name: String, //目标名称
            pi_name: String, //指标名称
            pi_source: { //指标来源：1,自己;2,上级分解;3,HR;4,目标计划;5,向上获取
                type: String,
                required: true,
                'enum': ['1', '2', '3', '4', '5'],
                default: '1',
            },
            target_value: String, //目标值
            unit: String, //目标值单位，直接保存单位名称，转换通过名称去查询
            weight: { //权重
                type: Number
            },
            grade_way: { //P:手工输入分数,G:选择等级打分--适用于定性指标(2)
                type: String,
                uppercase: true,
                'enum': ['P', 'G']
            },
            grade_group: { //等级组--选择按等级打分后--适用于定性指标(2)
                type: mongoose.Schema.Types.ObjectId,
                ref: 'GradeGroup',
            },
            pi_sc_name: String, //指标评分标准名称
            pi_sc_description: String, //指标评分标准
            f_score: { //计分--乘以权重之前的分数--记分公式直接输出的值
                type: Number,
                default: 0
            },
            score: { //得分
                type: Number,
                default: 0
            },
            self_weight: Number, //自评权重
            self_score: { //自评分
                type: Number,
                default: 0
            },
            self_final_score: { //自评最终得分
                type: Number,
                default: 0
            },
            indirect_weight: Number, //间接上级评分权重
            indirect_score: { //间接评分
                type: Number,
                default: 0
            },
            indirect_final_score: { //间接上级最终得分
                type: Number,
                default: 0
            },
            superior_weight: Number, //直接上级评分权重
            superior_score: { //上级评分
                type: Number,
                default: 0
            },
            superior_final_score: { //上级最终得分
                type: Number,
                default: 0
            },
            superior_superior_weight: Number, //上上级评分权重
            superior_superior_score: { //上上级评分
                type: Number,
                default: 0
            },
            superior_superior_final_score: { //上上级最终得分
                type: Number,
                default: 0
            },
            other_weight: Number, //他评权重
            other_score: { //他评得分
                type: Number,
                default: 0
            },
            other_final_score: { //他评最终得分
                type: Number,
                default: 0
            },
            other_peoples: [{
                people: { //评分人 
                    type: mongoose.Schema.Types.ObjectId,
                    ref: 'People',
                },
                weight: Number, //权重
                score: { //得分
                    type: Number,
                    default: 0
                },
                final_score: { //最终得分
                    type: Number,
                    default: 0
                },
                status: { //状态：1，保存；2，提交；
                    type: String,
                    required: true,
                    'enum': ['1', '2'],
                    default: '1'
                },
            }],
            status: { //1:正常,2:驳回
                type: String,
                required: true,
                'enum': ['1', '2'],
                default: '1',
            },
            actual_value_revise: [{ //实际值修改的历史记录
                revised_value: String, //值
                timestamp: Date, //时间戳
            }],
            //意见/评语
            comments: [{
                comment: String, //意见内容
                createDate: { //创建日期
                    type: Date,
                    default: new Date()
                },
                people_name: String,
                position_name: String,
                avatar: { //头像的文件名
                    type: mongoose.Schema.Types.ObjectId,
                    ref: 'GridFile'
                },
                creator: { //记录的创建人
                    type: mongoose.Schema.Types.ObjectId,
                    ref: 'People',
                }
            }, ],
            //过程管理中的总结记录信息
            wip_summary: [{
                gap_analysis: String, //差异分析
                improvement_plan: String, //改进计划
                createDate: { //创建日期
                    type: Date,
                    default: new Date()
                },
                start: { //改进计划的开始日期
                    type: Date,
                },
                end: { //改进计划的截止日期
                    type: Date,
                },
                finished: Boolean, //是否完成，已完成的不能修改，也不能删除。
                comments: [{ //针对每一个分解下来的小周期里面的每一个偏差分析进行的互动交流信息
                    comment: String, //意见内容
                    createDate: { //创建日期
                        type: Date,
                        default: new Date()
                    },
                    people_name: String,
                    position_name: String,
                    avatar: { //头像的文件名
                        type: mongoose.Schema.Types.ObjectId,
                        ref: 'GridFile'
                    },
                    creator: { //记录的创建人
                        type: mongoose.Schema.Types.ObjectId,
                        ref: 'People',
                    }
                }, ],
            }],
            //过程管理－周期细分－界面上可以预设一些细分的规则，例如：天，周，月
            segments: [{
                segment_name: String, //段的名称
                start: Date, //开始日期
                end: Date, //结束日期
                target_value: { //本段的目标值
                    type: Number,
                    default: 0
                },
                score: { //本段的实际得分－计分x指标权重的得分
                    type: Number,
                    default: 0
                },
                f_score: { //本段的计分－自评分/目标值 * 100
                    type: Number,
                    default: 0
                },
                self_score: { //自评分
                    type: Number,
                    default: 0
                },
                actual_value_revise: [{ //实际值修改的历史记录
                    revised_value: String, //值
                    timestamp: Date, //时间戳
                }],
                state: { //状态 0:变化中 1:领导最终确定实际值－不能再改了
                    type: String,
                    'enum': ['0', '1'],
                    default: '0'
                },
                segment_summary: [{ //对应小周期的过程管理数据
                    gap_analysis: String, //差异分析
                    improvement_plan: String, //改进计划
                    createDate: { //创建日期
                        type: Date,
                        default: new Date()
                    },
                    start: { //改进计划的开始日期
                        type: Date,
                    },
                    end: { //改进计划的截止日期
                        type: Date,
                    },
                    finished: Boolean, //是否完成，已完成的不能修改，也不能删除。
                    comments: [{ //针对每一个分解下来的小周期里面的每一个偏差分析进行的互动交流信息
                        comment: String, //意见内容
                        createDate: { //创建日期
                            type: Date,
                            default: new Date()
                        },
                        people_name: String,
                        position_name: String,
                        avatar: { //头像的文件名
                            type: mongoose.Schema.Types.ObjectId,
                            ref: 'GridFile'
                        },
                        creator: { //记录的创建人
                            type: mongoose.Schema.Types.ObjectId,
                            ref: 'People',
                        }
                    }, ],
                }],
                comments: [{ //针对每一个分解下来的小周期进行的互动交流信息
                    comment: String, //意见内容
                    createDate: { //创建日期
                        type: Date,
                        default: new Date()
                    },
                    people_name: String,
                    position_name: String,
                    avatar: { //头像的文件名
                        type: mongoose.Schema.Types.ObjectId,
                        ref: 'GridFile'
                    },
                    creator: { //记录的创建人
                        type: mongoose.Schema.Types.ObjectId,
                        ref: 'People',
                    }
                }, ],
                //行动计划
                actionplans: [{ //行动方案
                    type: mongoose.Schema.Types.ObjectId,
                    ref: 'ActionPlan',
                }],
            }],
            mark_as_watch: Boolean, //是否标记为本周期重点监控的指标
            mark_as_summary_type1: Boolean, //是否作为总结的指标 1:不足与改进 
            mark_as_summary_type2: Boolean, //是否作为总结的指标 2:亮点分享 
            //行动计划
            actionplans: [{ //行动方案
                type: mongoose.Schema.Types.ObjectId,
                ref: 'ActionPlan',
            }],
            //绩效总结
            summary: {
                // 不足与改进--对应summary type:1
                gap_analysis: { //绩效偏差及需要提升的能力分析
                    self_comment: String, //自评－当事人填写
                    upper_comment: { //领导的意见
                        comment: String, //意见内容
                        createDate: { //创建日期
                            type: Date,
                            default: new Date()
                        },
                        people_name: String,
                        position_name: String,
                        ou_name: String,
                        avatar: { //头像的文件名
                            type: mongoose.Schema.Types.ObjectId,
                            ref: 'GridFile'
                        },
                        creator: { //记录的创建人
                            type: mongoose.Schema.Types.ObjectId,
                            ref: 'People',
                        }
                    },
                    upper2_comment: { //上上级领导的意见
                        comment: String, //意见内容
                        createDate: { //创建日期
                            type: Date,
                            default: new Date()
                        },
                        people_name: String,
                        position_name: String,
                        ou_name: String,
                        avatar: { //头像的文件名
                            type: mongoose.Schema.Types.ObjectId,
                            ref: 'GridFile'
                        },
                        creator: { //记录的创建人
                            type: mongoose.Schema.Types.ObjectId,
                            ref: 'People',
                        }
                    },
                    hr_comment: { //HR的意见
                        comment: String, //意见内容
                        createDate: { //创建日期
                            type: Date,
                            default: new Date()
                        },
                        people_name: String,
                        position_name: String,
                        ou_name: String,
                        avatar: { //头像的文件名
                            type: mongoose.Schema.Types.ObjectId,
                            ref: 'GridFile'
                        },
                        creator: { //记录的创建人
                            type: mongoose.Schema.Types.ObjectId,
                            ref: 'People',
                        }
                    },
                },
                improvement_plan: { //改进措施
                    self_comment: String, //自评－当事人填写
                    upper_comment: { //领导的意见
                        comment: String, //意见内容
                        createDate: { //创建日期
                            type: Date,
                            default: new Date()
                        },
                        people_name: String,
                        position_name: String,
                        ou_name: String,
                        avatar: { //头像的文件名
                            type: mongoose.Schema.Types.ObjectId,
                            ref: 'GridFile'
                        },
                        creator: { //记录的创建人
                            type: mongoose.Schema.Types.ObjectId,
                            ref: 'People',
                        }
                    },
                    upper2_comment: { //上上级领导的意见
                        comment: String, //意见内容
                        createDate: { //创建日期
                            type: Date,
                            default: new Date()
                        },
                        people_name: String,
                        position_name: String,
                        ou_name: String,
                        avatar: { //头像的文件名
                            type: mongoose.Schema.Types.ObjectId,
                            ref: 'GridFile'
                        },
                        creator: { //记录的创建人
                            type: mongoose.Schema.Types.ObjectId,
                            ref: 'People',
                        }
                    },
                    hr_comment: { //HR的意见
                        comment: String, //意见内容
                        createDate: { //创建日期
                            type: Date,
                            default: new Date()
                        },
                        people_name: String,
                        position_name: String,
                        ou_name: String,
                        avatar: { //头像的文件名
                            type: mongoose.Schema.Types.ObjectId,
                            ref: 'GridFile'
                        },
                        creator: { //记录的创建人
                            type: mongoose.Schema.Types.ObjectId,
                            ref: 'People',
                        }
                    },
                },
                mark_as_watch: Boolean, //是否标记为下个周期重点监控的指标
                actionplans: [{ //行动方案-用于下一个周期的改进措施
                    type: mongoose.Schema.Types.ObjectId,
                    ref: 'ActionPlan',
                }],
                // 突出的绩效亮点分享--对应summary type:2
                performance_highlights: { //突出的绩效亮点分享
                    self_comment: String, //自评－当事人填写
                    upper_comment: { //领导的意见
                        comment: String, //意见内容
                        createDate: { //创建日期
                            type: Date,
                            default: new Date()
                        },
                        people_name: String,
                        position_name: String,
                        ou_name: String,
                        avatar: { //头像的文件名
                            type: mongoose.Schema.Types.ObjectId,
                            ref: 'GridFile'
                        },
                        creator: { //记录的创建人
                            type: mongoose.Schema.Types.ObjectId,
                            ref: 'People',
                        }
                    },
                    upper2_comment: { //上上级领导的意见
                        comment: String, //意见内容
                        createDate: { //创建日期
                            type: Date,
                            default: new Date()
                        },
                        people_name: String,
                        position_name: String,
                        ou_name: String,
                        avatar: { //头像的文件名
                            type: mongoose.Schema.Types.ObjectId,
                            ref: 'GridFile'
                        },
                        creator: { //记录的创建人
                            type: mongoose.Schema.Types.ObjectId,
                            ref: 'People',
                        }
                    },
                    hr_comment: { //HR的意见
                        comment: String, //意见内容
                        createDate: { //创建日期
                            type: Date,
                            default: new Date()
                        },
                        people_name: String,
                        position_name: String,
                        ou_name: String,
                        avatar: { //头像的文件名
                            type: mongoose.Schema.Types.ObjectId,
                            ref: 'GridFile'
                        },
                        creator: { //记录的创建人
                            type: mongoose.Schema.Types.ObjectId,
                            ref: 'People',
                        }
                    },
                },
            },
            mark_as_appeal: Boolean, //是否作为申诉的指标 
            //绩效申诉
            appeal: {
                reason: String, //申诉理由
                attachments: [{ //申诉相关附件
                    type: mongoose.Schema.Types.ObjectId,
                    ref: 'GridFile'
                }],
                status: { //申诉状态 0:未确认 1:已接受 2:已拒绝 (在流程中对单个指标的申述进行确认)
                    type: String,
                    'enum': ['0', '1', '2'],
                    default: '0'
                }
            },
            //相关附件
            attachments: [{
                type: mongoose.Schema.Types.ObjectId,
                ref: 'GridFile'
            }],
        }],
        sub_items: [{
            sub_item_name: { //分类名称
                type: String,
            },
            weight: Number, //权重
            score: { //定量指标分类评分
                type: Number,
                default: 0
            },
            final_score: { //定量指标分类最终得分
                type: Number,
                default: 0
            },
            items: [{
                pi: { //指标
                    type: mongoose.Schema.Types.ObjectId,
                    ref: 'PerformanceIndicatorClient',
                },
                ol: { //支撑的目标
                    type: mongoose.Schema.Types.ObjectId,
                    ref: 'ObjectiveLibrary',
                },
                pi_source: { //指标来源：1,自己;2,上级分解;3,HR;4,目标计划;5,向上获取
                    type: String,
                    required: true,
                    'enum': ['1', '2', '3', '4', '5'],
                    default: '1',
                },
                target_value: String, //目标值
                weight: { //子项权重
                    type: Number
                },
                score: Number, //得分
                self_weight: Number, //自评权重
                self_score: { //自评分
                    type: Number,
                    default: 0
                },
                self_final_score: { //自评最终得分
                    type: Number,
                    default: 0
                },
                superior_weight: Number, //直接上级评分权重
                superior_score: { //上级评分
                    type: Number,
                    default: 0
                },
                superior_final_score: { //上级最终得分
                    type: Number,
                    default: 0
                },
                superior_superior_weight: Number, //上上级评分权重
                superior_superior_score: { //上上级评分
                    type: Number,
                    default: 0
                },
                superior_superior_final_score: { //上上级最终得分
                    type: Number,
                    default: 0
                },
                other_weight: Number, //他评权重
                other_score: { //他评得分
                    type: Number,
                    default: 0
                },
                other_final_score: { //他评最终得分
                    type: Number,
                    default: 0
                },
                other_peoples: [{
                    people: { //评分人 
                        type: mongoose.Schema.Types.ObjectId,
                        ref: 'People',
                    },
                    weight: Number, //权重
                    score: { //得分
                        type: Number,
                        default: 0
                    },
                    final_score: { //最终得分
                        type: Number,
                        default: 0
                    },
                    status: { //状态：1，保存；2，提交；
                        type: String,
                        required: true,
                        'enum': ['1', '2'],
                        default: '1',
                    },
                }],
                status: { //1:正常,2:驳回
                    type: String,
                    'enum': ['1', '2'],
                    default: '1',
                },
                //意见/评语
                comments: [{
                    comment: String, //意见内容
                    createDate: { //创建日期
                        type: Date,
                        default: new Date()
                    },
                    creator: { //记录的创建人
                        type: mongoose.Schema.Types.ObjectId,
                        ref: 'People',
                    }
                }],
            }]
        }]
    },
    //360问卷项
    questionnairs: {
        is_assess: { //该项是否存在考核
            type: Boolean,
            default: false,
        },
        // qt: { //问卷模板
        //     type: mongoose.Schema.Types.ObjectId,
        //     ref: 'QuestionnairTemplateClient',
        // },
        score: { //得分
            type: Number,
            default: 0
        },
        weight: { //权重
            type: Number
        },

        //绩效总结
        summary: {
            gap_analysis: String, //差异分析
            improvement_plan: String, //改进计划
            upper_comment: String, //领导的意见
            upper2_comment: String, //上上级领导的意见
            hr_comment: String, //HR的意见
        },

    },
    //加分项
    others: [{
        item_type: { //1:加分项，2：减分项，3：一票否决项
            type: String,
            required: true,
            'enum': ['1', '2', '3'],
            default: '1'
        },
        score: { //总得分;当type为3的时候,score标识有没有违反,0：没有违反,1:违反
            type: Number,
            default: 0,
        },
        items: [{
            item: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'AssessmentItem',
            },
            item_name: String,
            dp_peoples: { //数据提供人
                type: mongoose.Schema.Types.ObjectId,
                ref: 'People'
            },
            dp_people_name: String,
            score: { //得分;当type为3的时候,score标识有没有违反,0：没有违反,1:违反
                type: Number,
                default: 0,
            },
            status: { //1:正常,2:驳回
                type: String,
                'enum': ['1', '2'],
                default: '1',
            },
            //意见/评语
            comments: [{
                comment: String, //意见内容
                createDate: { //创建日期
                    type: Date,
                    default: new Date()
                },
                creator: { //记录的创建人
                    type: mongoose.Schema.Types.ObjectId,
                    ref: 'People',
                }
            }],
            mark_as_watch: Boolean, //是否标记为本周期重点监控的指标
            //行动计划
            actionplans: [{ //行动方案
                type: mongoose.Schema.Types.ObjectId,
                ref: 'ActionPlan',
            }],
            //绩效总结
            summary: {
                gap_analysis: String, //差异分析
                improvement_plan: String, //改进计划
                upper_comment: String, //领导的意见
                upper2_comment: String, //上上级领导的意见
                hr_comment: String, //HR的意见
                mark_as_watch: Boolean, //是否标记为下个周期重点监控的指标
                actionplans: [{ //行动方案-用于下一个周期的改进措施
                    type: mongoose.Schema.Types.ObjectId,
                    ref: 'ActionPlan',
                }],
            },
            mark_as_appeal: Boolean, //是否作为申诉的指标 
            //绩效申诉
            appeal: {
                reason: String, //申诉理由
                attachments: [{ //申诉相关附件
                    type: mongoose.Schema.Types.ObjectId,
                    ref: 'GridFile'
                }],
                status: { //申诉状态 0:未确认 1:已接受 2:已拒绝 (在流程中对单个指标的申述进行确认)
                    type: String,
                    'enum': ['0', '1', '2'],
                    default: '0'
                }
            },
        }],
        sub_items: [{
            sub_item_name: { //分类名称
                type: String,
            },
            score: { //总得分;当type为3的时候,score标识有没有违反,0：没有违反,1:违反
                type: Number,
                default: 0,
            },
            items: [{
                item: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: 'AssessmentItem',
                },
                item_name: String,
                score: { //总得分;当type为3的时候,score标识有没有违反,0：没有违反,1:违反
                    type: Number,
                    default: 0,
                },
                status: { //1:正常,2:驳回
                    type: String,
                    'enum': ['1', '2'],
                    default: '1',
                },
                //意见/评语
                comments: [{
                    comment: String, //意见内容
                    createDate: { //创建日期
                        type: Date,
                        default: new Date()
                    },
                    creator: { //记录的创建人
                        type: mongoose.Schema.Types.ObjectId,
                        ref: 'People',
                    }
                }],
            }]
        }]
    }],

    //绩效总结
    summary: {
        self_comment: String, //自评－当事人填写
        upper_comment: { //简介领导的意见
            comment: String, //意见内容
            createDate: { //创建日期
                type: Date,
                default: new Date()
            },
            people_name: String,
            position_name: String,
            ou_name: String,
            avatar: { //头像的文件名
                type: mongoose.Schema.Types.ObjectId,
                ref: 'GridFile'
            },
            creator: { //记录的创建人
                type: mongoose.Schema.Types.ObjectId,
                ref: 'People',
            }
        },
        upper2_comment: { //直接上级领导的意见
            comment: String, //意见内容
            createDate: { //创建日期
                type: Date,
                default: new Date()
            },
            people_name: String,
            position_name: String,
            ou_name: String,
            avatar: { //头像的文件名
                type: mongoose.Schema.Types.ObjectId,
                ref: 'GridFile'
            },
            creator: { //记录的创建人
                type: mongoose.Schema.Types.ObjectId,
                ref: 'People',
            }
        },

    },

    //绩效面谈
    review: {
        // 基本信息（抬头）
        initiator: { //面谈发起人
            type: mongoose.Schema.Types.ObjectId,
            ref: 'People',
        },
        attendees: [{ //面谈参与人
            type: mongoose.Schema.Types.ObjectId,
            ref: 'People',
        }],
        place: String, //面谈地点
        start: Date, //面谈开始时间
        end: Date, //面谈结束时间
        // 内容
        //第一步：上期绩效回顾(点评纪要)
        step1: String,
        //第二步：面谈提纲撰写
        step21: String, //2.1、面谈发起人填写下期部门重点工作与任务分配
        step221: String, //2.2.1、对上级布置的工作目标和工作计划是否认同，阐述的大致的工作思路和方法如何？
        step221r: String, //2.2.1、面谈发起人意见
        step222: String, //2.2.2、约谈者展开下期工作所需资源和支持
        step222r: String, //2.2.2、面谈发起人意见
        //第三步：面谈沟通纪要
        step3: String,
        //相关附件
        attachments: [{
            file: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'GridFile'
            },
            people: {
                type: mongoose.Schema.Types.ObjectId, //当前上传的人
                ref: 'People'
            },
        }],
    },
})

AssessmentInstanceSchema.plugin(valid);

AssessmentInstanceSchema.index({
    client: 1,
    company: 1,
    period: 1,
    position: 1,
    people: 1,
    ai_name: 1
}, {
    unique: true,
    dropDups: true
}); //定义复合索引——唯一键

module.exports.AssessmentInstanceSchema = AssessmentInstanceSchema;

//问卷实例 
var QuestionnairInstanceSchema = mongoose.Schema({
    client: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Client',
    },
    people: { //被考核人
        type: mongoose.Schema.Types.ObjectId,
        ref: 'People',
    },
    people_name: String,
    position: { //被考核人职位
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Position'
    },
    position_name: String,
    period: { //考核周期
        type: mongoose.Schema.Types.ObjectId,
        ref: 'PeriodManagement',
    },
    period_name: String,
    company_name: String,
    ou_name: String,
    qtc: { //问卷模板
        type: mongoose.Schema.Types.ObjectId,
        ref: 'QuestionnairTemplateClient',
    },
    qt_name: { //问卷名称
        type: String,
        required: true
    },
    score: { //问卷得分
        type: Number,
        default: 0
    },
    status: { //状态，0:已下发，1:已完成，2:已终止，
        type: String,
        'enum': ['0', '1', '2'],
        default: '0',
    },
    createDate: { //发布日期
        type: Date,
        default: new Date(),
    },
    lastDate: { //收回截止日期
        type: Date,
    },

    //1.满意度调查问卷
    items: [{
        category: String, //如果为空，则没有二级分类
        score: { //得分
            type: Number,
            default: 0
        },
        qtis: [{
            qti_name: { //题目名称
                type: String,
                required: true
            },
            scoring_criteria: String, //评分标准
            score: { //得分
                type: Number,
            },
        }],
    }],
    //2.选项统计问卷
    option_items: [{
        qti_name: { //题目名称
            type: String,
        },
        qti_options: [{
            option: String,
            option_description: String,
        }],
        result: { //qti_options的index,便于统计
            type: Number,
        },
    }],
    //3.测验测评问卷
    test_items: [{
        category: String, //如果为空，则没有二级分类
        score_value: { //分值
            type: Number,
            default: 0,
        },
        score: { //得分
            type: Number,
            default: 0
        },
        qtis: [{
            qti_name: { //题目名称
                type: String,
            },
            qti_type: { //1:单选,2:多选
                type: String,
                'enum': ['1', '2'],
                default: '1',
            },
            qti_score_value: { //分值
                type: Number,
                default: 0,
            },
            score: { //得分
                type: Number,
                default: 0
            },
            qti_options: [{
                option: String,
                option_description: String,
                is_answer: {
                    type: Boolean,
                    default: false
                },
                result: {
                    type: Boolean,
                    default: false
                },
            }],
        }]
    }],
})

// QuestionnairInstanceSchema.index({
//     client: 1,
//     ai: 1,
// }, {
//     unique: true,
//     dropDups: true
// }); //定义复合索引——唯一键

module.exports.QuestionnairInstanceSchema = QuestionnairInstanceSchema;
// //强制分布等级配置
// var ForcedDistributionGradeClientSchema = mongoose.Schema({
//     client: {
//         type: mongoose.Schema.Types.ObjectId,
//         ref: 'Client'
//     },
//     forced_distribution_grade_algorithm: { //强制分布等级算法 'A':正太分布-向下取整  'B':正太分布-四舍五入 'C':强制配置
//         type: String,
//         'enum': ['A', 'B', 'C'],
//         default: 'A'
//     },
//     points_system_name: { //关联的分制等级
//         type: mongoose.Schema.Types.ObjectId,
//         ref: 'PointsSystemClient'
//     },
//     grades: [{
//         grade_name: { //等级名称
//             type: String,
//             required: true
//         },
//         grade_low_value: { //最低分
//             type: Number,
//             required: true
//         },
//         grade_high_value: { //最高分
//             type: Number,
//             required: true
//         },
//         grade_description: { //等级描述
//             type: String
//         },
//     }],

// })

// ForcedDistributionGradeClientSchema.plugin(valid);
// ForcedDistributionGradeClientSchema.index({
//     client: 1,
//     points_system_name: 1
// }, {
//     unique: true,
//     dropDups: true
// }); //定义复合索引——唯一键
// module.exports.ForcedDistributionGradeClientSchema = ForcedDistributionGradeClientSchema;

var AssessmentAttachmentSchema = mongoose.Schema({ //绩效附件表
    client: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Client'
    },
    file: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'GridFile'
    },
    people: {
        type: mongoose.Schema.Types.ObjectId, //当前上传的人
        ref: 'People'
    },
})

module.exports.AssessmentAttachmentSchema = AssessmentAttachmentSchema;

//数据收集
var DataCollectionSchema = mongoose.Schema({
    client: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Client'
    },
    company: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Company',
    },
    people: { //数据提供人 
        type: mongoose.Schema.Types.ObjectId,
        ref: 'People',
    },
    people_name: String, //数据提供人名称
    ou: { //数据提供人部门
        type: mongoose.Schema.Types.ObjectId,
        ref: 'OrganizationUnit',
    },
    ou_name: String,
    position: { //数据提供人职位
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Position',
    },
    position_name: String,
    dc_status: { //0:收集中,1:收集完毕,
        type: String,
        required: true,
        'enum': ['0', '1'],
        default: '0',
    },
    pi: { //对应流程实例id
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ProcessInstance'
    },
    items: [{
        ai: { //对应的绩效合同
            type: mongoose.Schema.Types.ObjectId,
            ref: 'AssessmentInstance',
        },
        people: { //被考核人 
            type: mongoose.Schema.Types.ObjectId,
            ref: 'People',
        },
        people_name: String, //被考核人名称
        ou: { //被考核人部门
            type: mongoose.Schema.Types.ObjectId,
            ref: 'OrganizationUnit',
        },
        ou_name: String,
        position: { //被考核人职位
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Position',
        },
        position_name: String,
        period: { //周期(考核期间)
            type: mongoose.Schema.Types.ObjectId,
            ref: 'PeriodManagement',
        },
        period_name: String,
        item_status: { //0:收集中,1:收集完毕,
            type: String,
            required: true,
            'enum': ['0', '1'],
            default: '0',
        },
        modify_reason: String, //发布考核时修改原因
        sub_items: [{
            item_type: { //项目类型: 1,定量指标;2,加分项;3,减分项
                type: String,
                required: true,
                'enum': ['1', '2', '3'],
                default: '1'
            },
            item_type_name: String,
            pi: { //指标
                type: mongoose.Schema.Types.ObjectId,
                ref: 'PerformanceIndicatorClient',
            },
            pi_name: String, //指标名称
            pi_unit: String, //指标单位
            ol: { //目标
                type: mongoose.Schema.Types.ObjectId,
                ref: 'ObjectiveLibrary',
            },
            ol_name: String, //目标名称
            item: { //加减分项
                type: mongoose.Schema.Types.ObjectId,
                ref: 'AssessmentItem',
            },
            assessmentitem_name: String, //加减分项名称
            target_value: Number, //目标值
            actual_value: Number, //实际值
            creator: { //录入人
                type: mongoose.Schema.Types.ObjectId,
                ref: 'People',
            },
            createDate: { //创建日期
                type: Date,
                default: new Date()
            },
        }],
    }],
})

module.exports.DataCollectionSchema = DataCollectionSchema;

DataCollectionSchema.statics.update_ai_status = function(ai_ids, cb) {
    var self = this;
    var AssessmentInstance = require('../models/pm').AssessmentInstance;
    async.times(ai_ids.length, function(n, next) {
        var ai_id = ai_ids[n];
        self.find({
            "items.ai": ai_id
        }, function(err, dcs) {
            if (err) {
                return next(err, null);
            };
            if (dcs) {
                var bool = true;
                //遍历包含该绩效合同的收集数据，如果全部都已收集完成，则修改状态到发布考核
                _.each(dcs, function(dc) {
                    var item = _.find(dc.items, function(x) {
                        return _.isEqual(x.ai, ai_id);
                    })
                    if (!item || item.item_status == '0') {
                        bool = false;
                        return;
                    }
                });
                if (bool) {
                    AssessmentInstance.findByIdAndUpdate(ai_id, {
                        ai_status: '6'
                    }, next);
                } else {
                    next(null, null);
                }
            } else {
                next(null, null);
            }
        });
    }, cb)
}

//问卷模板(360和能力评估)-从老的模板(QuestionnairTemplateSchema)分离出，以题目维度设置--客户级
var Questionnair360AndCAClientSchema = mongoose.Schema({
    client: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Client'
    },
    qt_name: { //问卷名称
        type: String,
        required: true
    },
    qt_description: String, //问卷描述
    points_system: { //分制
        type: mongoose.Schema.Types.ObjectId,
        ref: 'PointsSystemClient',
    },
    questionnair_category: { //问卷类别:1,360考核问卷;2,能力评估问卷;
        type: String,
        required: true,
        'enum': ['1', '2'],
        default: '1'
    },
    weight_loss_rule: { //1:分摊给上级;2:按比例分摊到其他
        type: String,
        required: true,
        'enum': ['1', '2'],
        default: '1'
    },
    score_sampling_rule: { //1:整体平均;2:去掉最高和最低分后平均
        type: String,
        required: true,
        'enum': ['1', '2'],
        default: '1'
    },
    grade_way: { //P:手工输入分数,G:选择等级打分
        type: String,
        required: true,
        uppercase: true,
        'enum': ['P', 'G'],
        default: 'P',
    },
    grade_group: { //等级组--选择按等级打分后
        type: mongoose.Schema.Types.ObjectId,
        ref: 'GradeGroup',
    },
    frequency_of_usage: { //使用频次
        type: Number,
        default: 0
    },
    self_weight: Number, //自评权重
    sibling_weight: Number, //同级权重
    superior_weight: Number, //上级评分权重
    superior_superior_weight: Number, //上上级评分权重
    subordinate_weight: Number, //下级评分权重
    outsider_weigth: Number, //外部人员权重
    assess_positions: [{
        position: { //考核对象
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Position'
        },
        position_name: String,
        company_name: String,
        ou_name: String,
        joblevel_name: String,
    }],
    items: [{
        category: String, //如果为空，则没有二级分类
        weight: Number, //二级分类权重，没有二级分类则为空
        qtis: [{
            qti_name: { //题目名称
                type: String,
                required: true
            },
            source: { //1:新建,2:题库,3:能力素质库
                type: String,
                required: true,
                'enum': ['1', '2', '3'],
                default: '1'
            },
            competencyclient: { //当数据来源为3时，此处关联胜任力
                type: mongoose.Schema.Types.ObjectId,
                ref: 'CompetencyClient'
            },
            scoring_criteria: String, //评分标准
            qti_weight: Number //题目所占权重
        }],
    }],
})
Questionnair360AndCAClientSchema.plugin(valid);

module.exports.Questionnair360AndCAClientSchema = Questionnair360AndCAClientSchema;
//绩效工资系数配置
/*@  1.个人绩效工资系数配置
       (1).按等级组配置
       (2).设定绩效得分区间
       (3).指标分类 --@{<1>.加权求和 <2>.乘积}
       (4).按目标得分区间
    2.部门绩效工资系数配置
       (1).部门负责人  +  (1)(2)(3)(4)
       (2).部门总均分  +  (1)(2)(3)(4)
@*/
PerformancePayrollFactorSchema = mongoose.Schema({
    client: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Client'
    },
    factor_name: String,
    factor_category: { //系数大分类  
        type: String,
        enum: ['P', 'O'], //P:个人  O:部门
        default: 'P'
    },
    org_category: { //系数小分类  只有factor_category == 'O'时才有数据
        type: String,
        enum: ['M', 'A'] //M:部门管理者  A:部门总均分
    },
    factor_items: {
        grades: [{ //默认分制下的等级组
            grade_name: String, //当绩效等级或强制分布等级== grade_name时取此等级的系数
            factor: Number
        }],
        score_section: [{ //自定义得分区段
            score_low_value: { //最低分
                type: Number,
            },
            score_high_value: { //最高分
                type: Number,
            },
            factor_type: { //系数类型  D:自定义  L:线性 
                type: String,
                enum: ['D', 'L'],
                default: 'D'
            },
            factor: Number, //自定义系数
            linear_factor: {
                type: Number,
                default: 100
            } //线性系数

        }],
        object_section: [{ //目标得分区间
            score_low_value: { //最低分
                type: Number,
            },
            score_high_value: { //最高分
                type: Number,
            },
            factor_type: { //系数类型  D:自定义  L:线性  线性--- 系数/得分
                type: String,
                enum: ['D', 'L'],
                default: 'D'
            },
            factor: Number, //自定义系数
            linear_factor: {
                type: Number,
                default: 100
            } //线性系数
        }]
    }

})
PerformancePayrollFactorSchema.index({
    client: 1,
    factor_name: 1
}, {
    unique: true,
    dropDups: true
}); //定义复合索引——唯一键

module.exports.PerformancePayrollFactorSchema = PerformancePayrollFactorSchema;

//问卷实例(360和能力评估)
var Questionnair360AndCAInstanceSchema = mongoose.Schema({
    client: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Client',
    },
    people: { //问卷被考核人
        type: mongoose.Schema.Types.ObjectId,
        ref: 'People',
    },
    people_name: String,
    position: { //被考核人职位
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Position'
    },
    position_name: String,
    period: { //考核周期
        type: mongoose.Schema.Types.ObjectId,
        ref: 'PeriodManagement',
    },
    period_name: String,
    company_name: String,
    ou_name: String,
    qtc: { //问卷模板
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Questionnair360AndCAClient',
    },
    qt_name: String, //问卷名称,
    qt_description: String, //问卷描述
    points_system: { //分制
        type: mongoose.Schema.Types.ObjectId,
        ref: 'PointsSystemClient',
    },
    questionnair_category: { //问卷类别:1,360考核问卷;2,能力评估问卷;
        type: String,
        required: true,
        'enum': ['1', '2'],
        default: '1'
    },
    weight_loss_rule: { //1:分摊给上级;2:按比例分摊到其他
        type: String,
        required: true,
        'enum': ['1', '2'],
        default: '1'
    },
    score_sampling_rule: { //1:整体平均;2:去掉最高和最低分后平均
        type: String,
        required: true,
        'enum': ['1', '2'],
        default: '1'
    },
    grade_way: { //P:手工输入分数,G:选择等级打分
        type: String,
        required: true,
        uppercase: true,
        'enum': ['P', 'G'],
        default: 'P',
    },
    grade_group: { //等级组--选择按等级打分后
        type: mongoose.Schema.Types.ObjectId,
        ref: 'GradeGroup',
    },
    self_weight: Number, //自评权重
    sibling_weight: Number, //同级权重
    superior_weight: Number, //上级评分权重
    superior_superior_weight: Number, //上上级评分权重
    subordinate_weight: Number, //下级评分权重
    f_score: { //问卷计分
        type: Number,
        default: 0
    },
    score: { //问卷得分
        type: Number,
        default: 0
    },
    number_of_people: Number, //发布人数
    actual_number_of_people: { //实际参与人数
        type: Number,
        default: 0
    },
    status: { //状态，0:已下发，1:已完成，2:已终止，
        type: String,
        'enum': ['0', '1', '2'],
        default: '0',
    },
    createDate: { //发布日期
        type: Date,
        default: new Date(),
    },
    lastDate: { //收回截止日期
        type: Date,
    },
    dimensions: [{ //问卷明细
        dimension: { //1:自评,2:上级,3:同级,4:下级,5:上上级
            type: String,
            'enum': ['1', '2', '3', '4', '5'],
        },
        number_of_people: Number, //参与人数
        actual_number_of_people: { //实际参与人数
            type: Number,
            default: 0
        },
        status: { //状态，0:已下发，1:已完成，
            type: String,
            'enum': ['0', '1'],
            default: '0',
        },
        weight: Number,
        f_score: { //计分
            type: Number,
            default: 0
        },
        score: { //得分
            type: Number,
            default: 0
        },
        items: [{
            category: String, //如果为空，则没有二级分类
            weight: Number, //二级分类权重，没有二级分类则为空
            f_score: { //计分
                type: Number,
                default: 0
            },
            score: { //得分
                type: Number,
                default: 0
            },
            status: { //状态，0:已下发，1:已完成，
                type: String,
                'enum': ['0', '1'],
                default: '0',
            },
            qtis: [{
                qti_name: { //题目名称
                    type: String,
                    required: true
                },
                source: { //1:新建,2:题库,3:能力素质库
                    type: String,
                    required: true,
                    'enum': ['1', '2', '3'],
                    default: '1'
                },
                competencyclient: { //当数据来源为3时，此处关联胜任力
                    type: mongoose.Schema.Types.ObjectId,
                    ref: 'CompetencyClient'
                },
                scoring_criteria: String, //评分标准
                qti_weight: Number, //题目所占权重
                f_score: { //计分
                    type: Number,
                    default: 0
                },
                score: { //得分
                    type: Number,
                    default: 0
                },
                status: { //状态，0:已下发，1:已完成，
                    type: String,
                    'enum': ['0', '1'],
                    default: '0',
                },
                peoples: [{
                    people: { //评分人
                        type: mongoose.Schema.Types.ObjectId,
                        ref: 'People',
                    },
                    f_score: Number, //计分
                    score: Number, //得分
                    status: { //状态，0:已下发，1:已完成，
                        type: String,
                        'enum': ['0', '1'],
                        default: '0',
                    },
                    submitDate: { //提交日期
                        type: Date,
                    },
                }],
            }],
        }],
    }],
})

Questionnair360AndCAInstanceSchema.index({
    client: 1,
    people: 1,
    position: 1,
    period: 1,
}, {
    unique: true,
    dropDups: true
}); //定义复合索引——唯一键
module.exports.Questionnair360AndCAInstanceSchema = Questionnair360AndCAInstanceSchema;
module.exports.PerformancePayrollFactorSchema = PerformancePayrollFactorSchema;
//系数组合
FactorCombinationSchema = mongoose.Schema({
    client: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Client'
    },
    combination_name: String,
    combination_data: {
        factor_type: {
            type: String,
            'enum': ['A', 'B', 'C'],
            default: 'A'
        },
        // is_weight: {
        //     type: Boolean,
        //     default: false
        // },
        people_data: {
            factor: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'PerformancePayrollFactor'
            },
            factor_detail: {
                type: String,
                'enum': ['A', 'B'], //'A':取等级数据 'B':取绩效得分区间数据
                default: 'A',
            },
            weight: Number
        },
        org_data: {
            factor: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'PerformancePayrollFactor'
            },
            factor_detail: {
                type: String,
                'enum': ['A', 'B', 'C'], //'A':取等级数据 'B':取绩效得分区间数据 'C':取目标得分区间数据
                default: 'A',
            },
            weight: Number
        }

    }
})
FactorCombinationSchema.index({
    client: 1,
    combination_name: 1
}, {
    unique: true,
    dropDups: true
}); //定义复合索引——唯一键
module.exports.FactorCombinationSchema = FactorCombinationSchema;
//人员系数赋予
PeopleFactorSchema = mongoose.Schema({
    client: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Client'
    },
    people: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'People'
    },
    position: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Position'
    },
    com_factor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'FactorCombination'
    }
})
PeopleFactorSchema.index({
    client: 1,
    people: 1,
    position: 1,
}, {
    unique: true,
    dropDups: true
}); //定义复合索引——唯一键
module.exports.PeopleFactorSchema = PeopleFactorSchema;
PerformancePayrollInitSchema = mongoose.Schema({
    client: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Client'
    },
    people_no: String,
    period_type: { //1:年,2:半年,3:季，4:月，5:周
        type: String,
        required: true,
        uppercase: true,
        'enum': ['1', '2', '3', '4', '5']
    },
    people: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'People'
    },
    position_no: String,
    position: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Position'
    },
    company: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Company'
    },
    init_value: Number
})
// PerformancePayrollInitSchema.index({
//     client: 1,
// }, {
//     // unique: true,
//     // dropDups: true
// }); //定义复合索引——唯一键
module.exports.PerformancePayrollInitSchema = PerformancePayrollInitSchema;
PeopleFactorSchema.index({
    client: 1,
    people: 1,
    position: 1,
}, {
    unique: true,
    dropDups: true
}); //定义复合索引——唯一键
module.exports.PeopleFactorSchema = PeopleFactorSchema;
PerformancePayrollInstanceSchema = mongoose.Schema({
    client: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Client'
    },
    year: String, //什么时间的数据
    year_month: String, //到哪个月的时候更新到薪资表里
    company: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Company'
    },
    payroll_item: { //对应的工资项
        type: mongoose.Schema.Types.ObjectId,
        ref: 'PayrollItemClient'
    },
    period_type_values: [{
        period_type: { //1:年,2:半年,3:季，4:月，5:周
            type: String,
            required: true,
            uppercase: true,
            'enum': ['1', '2', '3', '4', '5']
        },
        period_value: Number, //周期值；从0开始，如一月，一季度为0；二月，二季度为1；递增
    }],
    people_values: [{
        ai: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'AssessmentInstance'
        },
        base_value: Number, //基数
        c_value: Number, //系数
        value: Number, //薪资
    }]

})
PerformancePayrollInstanceSchema.plugin(valid);
PerformancePayrollInstanceSchema.index({
    client: 1,
    year_month: 1,
    company: 1,
}, {
    unique: true,
    dropDups: true
}); //定义复合索引——唯一键
module.exports.PerformancePayrollInstanceSchema = PerformancePayrollInstanceSchema;

//九宫图配置
HoroScopeSchema = mongoose.Schema({
    client: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Client'
    },
    x_title: String, //X轴名称
    xis_max: Number, //X 轴最大刻度
    x_a: Number,
    x_b: Number,
    y_title: String, //y轴名称
    yis_max: Number, //Y轴最大刻度
    y_a: Number,
    y_b: Number,
    color: [{
        block_name: String, //块名称
        color_type: String, //颜色
        color_des_category: String, //颜色描述类别
        color_description: String, //颜色描述
        x1: Number,
        x2: Number,
        y1: Number,
        y2: Number
    }]
})
HoroScopeSchema.index({
    client: 1,
}, {
    unique: true,
    dropDups: true
}); //定义复合索引——唯一键
module.exports.HoroScopeSchema = HoroScopeSchema;
//人才盘点
TalentLambdaSchema = mongoose.Schema({
    client: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Client'
    },
    lambda_name: String, //人才盘点名称
    //人才盘点数据  (能力得分 以及绩效得分 )最终得分由权重得出
    lambda_period: String, //人才盘点周期
    lambda_ai_period: [{ //绩效周期
        period: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'PeriodManagement'
        },
        period_name: String,
        from: String,
        to: String
    }],
    lambda_ques_360: [{ //问卷周期
        period: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'PeriodManagement'
        },
        qt_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'QuestionnairTemplateClient'
        },
        period_name: String, //周期名称
        qt_name: String, //问卷名称
        begin: Date
    }],
    ai_weight: Number, //绩效权重
    com_weight: Number, //能力权重
    lambda_object: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Position'
    }],
    lambda_data: [{

        ou_name: String,
        company_name: String,
        people_no: String,
        position_name: String,
        people: { //人才盘点对象
            type: mongoose.Schema.Types.ObjectId,
            ref: 'people'
        },
        position: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'position'
        },
        people_name: String,
        ai_score: Number, //绩效得分
        score: Number, //能力得分
        total_score: Number, //最终得分
        rank: String, //最终得分排名
        horoscope: String, //九宫图区间,
        horoscope_id: String //九宫区域_id
    }],
    lambda_date: Date, //最后保存数据的时间
    is_save: { //if is_save == true  only can view && cannot edit
        type: Boolean,
        default: false
    }
})
TalentLambdaSchema.plugin(valid);
TalentLambdaSchema.index({
    client: 1,
    lambda_name: 1,
    lambda_period: 1
}, {
    unique: true,
    dropDups: true
}); //定义复合索引——唯一键
module.exports.TalentLambdaSchema = TalentLambdaSchema;
//人才池
//清单 : 0:淘汰  1:警告  2: 发展  3. 晋升 
TalentPoolSchema = mongoose.Schema({
    client: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Client'
    },
    talent_type: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'TalentType'
    },
    type_name: String,
    lambda_name: String,
    talent_lambda: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'TalentLambda'
    },
    people: { //人员
        type: mongoose.Schema.Types.ObjectId,
        ref: 'People'
    },
    history: { //true:逻辑删除,当作历史记录
        type: Boolean,
        default: false
    },
    changeDate: Date, //该记录变更日期,
    change_reason: String, //转换理由
    change_data: { //扩展的人才池变更记录
        from: { //上一个人才池
            type: mongoose.Schema.Types.ObjectId,
            ref: 'TalentPool'
        },
        pool_name: String, //上一个人才池名称
        operator: { //操作人
            type: mongoose.Schema.Types.ObjectId,
            ref: 'People'
        },
        operator_name: String, //操作人姓名

    },
    //废弃
    // adjust_payroll_data: [{ //调薪数据
    //     is_adjust: {
    //         type: Boolean,
    //         default: false
    //     },
    //     adjust_payroll: { ////调薪
    //         type: mongoose.Schema.Types.ObjectId,
    //         ref: 'PYAdjustSingle'
    //     },
    //     operator: { //操作人
    //         type: mongoose.Schema.Types.ObjectId,
    //         ref: 'People'
    //     },
    //     operator_name: String, //操作人姓名
    //     operate_date: Date //操作日期
    // }],
    // position_up_data: [{ //晋升流程
    //     is_adjust: {
    //         type: Boolean,
    //         default: false
    //     },
    //     adjust_position: { ////晋升流程
    //         type: mongoose.Schema.Types.ObjectId,
    //         ref: 'PAPromotion'
    //     },
    //     operator: { //操作人
    //         type: mongoose.Schema.Types.ObjectId,
    //         ref: 'People'
    //     },
    //     operator_name: String, //操作人姓名
    //     operate_date: Date //操作日期

    // }],
    // position_leave_data: [{ //降级流程
    //     is_adjust: {
    //         type: Boolean,
    //         default: false
    //     },
    //     adjust_position: { ////降级流程
    //         type: mongoose.Schema.Types.ObjectId,
    //         ref: 'PADemotion'
    //     },
    //     operator: { //操作人
    //         type: mongoose.Schema.Types.ObjectId,
    //         ref: 'People'
    //     },
    //     operator_name: String, //操作人姓名
    //     operate_date: Date //操作日期

    // }],
    // position_move_data: [{ //职级平调
    //     is_adjust: {
    //         type: Boolean,
    //         default: false
    //     },
    //     adjust_position: { ////职级平调
    //         type: mongoose.Schema.Types.ObjectId,
    //         ref: 'PAMove'
    //     },
    //     operator: { //操作人
    //         type: mongoose.Schema.Types.ObjectId,
    //         ref: 'People'
    //     },
    //     operator_name: String, //操作人姓名
    //     operate_date: Date //操作日期

    // }],
    performance_warning: [{ //绩效警告
        is_warning: {
            type: Boolean,
            default: false
        },
        operator: { //操作人
            type: mongoose.Schema.Types.ObjectId,
            ref: 'People'
        },
        operator_name: String, //操作人姓名
        operate_date: Date //操作日期
    }]



})
TalentPoolSchema.plugin(valid);
TalentPoolSchema.index({
    client: 1,
    talent_lambda: 1,
    talent_type: 1,
    changeDate: 1,
    people: 1
}, {
    unique: true,
    dropDups: true
}); //定义复合索引——唯一键
module.exports.TalentPoolSchema = TalentPoolSchema;

//人才分类数据字典
TalentTypeSchema = mongoose.Schema({
    client: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Client'
    },
    type_name: String, //分类名称
    type_description: String, //分类描述
    // block_name: String //九宫图区域块
    horoscope: [{ //人才分类和区域块是一对多的关系
        type: String,
    }]

})
TalentTypeSchema.plugin(valid);
TalentTypeSchema.index({
    client: 1,
    type_name: 1
}, {
    unique: true,
    dropDups: true
}); //定义复合索引——唯一键
module.exports.TalentTypeSchema = TalentTypeSchema;
//人才培养类别
DevelopeTypeSchema = mongoose.Schema({
    client: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Client'
    },
    type_name: String, //分类名称
    type_description: String, //分类描述
    develope_style: [{ //培养方式
        style_name: String,
        style_description: String,
        learn_style: [{ //学习方式
            type: mongoose.Schema.Types.ObjectId,
            ref: 'LearnStyle'
        }],
        check_style: [{ //评估方式
            type: mongoose.Schema.Types.ObjectId,
            ref: 'CheckStyle'
        }]
    }]

})
DevelopeTypeSchema.plugin(valid);
DevelopeTypeSchema.index({
    client: 1,
    type_name: 1
}, {
    unique: true,
    dropDups: true
}); //定义复合索引——唯一键
module.exports.DevelopeTypeSchema = DevelopeTypeSchema;
// //培养方式
DevelopeStyleSchema = mongoose.Schema({
    client: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Client'
    },
    type_name: String, //人才培养类别名称   
    type_description: String, //分类描述

})
DevelopeStyleSchema.plugin(valid);
DevelopeStyleSchema.index({
    client: 1,
    type_name: 1
}, {
    unique: true,
    dropDups: true
}); //定义复合索引——唯一键
module.exports.DevelopeStyleSchema = DevelopeStyleSchema;
//学习方式
LearnStyleSchema = mongoose.Schema({
    client: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Client'
    },
    type_name: String, //人才培养类别名称   
    type_description: String, //分类描述

})
LearnStyleSchema.plugin(valid);
LearnStyleSchema.index({
    client: 1,
    type_name: 1
}, {
    unique: true,
    dropDups: true
}); //定义复合索引——唯一键
module.exports.LearnStyleSchema = LearnStyleSchema;
//评估方式
CheckStyleSchema = mongoose.Schema({
    client: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Client'
    },
    type_name: String, //人才培养类别名称   
    type_description: String, //分类描述

})
CheckStyleSchema.plugin(valid);
CheckStyleSchema.index({
    client: 1,
    type_name: 1
}, {
    unique: true,
    dropDups: true
}); //定义复合索引——唯一键
module.exports.CheckStyleSchema = CheckStyleSchema;
//培养方向
DevelopeDirectSchema = mongoose.Schema({
    client: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Client'
    },
    direct_code: String, //培养方向代码
    direct_name: String, //培养方向名称   
    direct_description: String, //培养方向名称
    // position_data: [{//改：每一个目标职位后面都可以跟候选对象（职位）
    //     position: { //目标职位
    //         type: mongoose.Schema.Types.ObjectId,
    //         ref: 'Position'
    //     },
    //     position_name: String
    // }],
    // candidate_data: [{
    //     position: { //候选对象
    //         type: mongoose.Schema.Types.ObjectId,
    //         ref: 'Position'
    //     },
    //     position_name: String
    // }]
    //version2
    // data: [{
    //     des_position: {
    //         type: mongoose.Schema.Types.ObjectId,
    //         ref: 'Position'
    //     },
    //     des_position_name: String,
    //     des_position_code: String,
    //     can_position_data: [{
    //         can_position: {
    //             type: mongoose.Schema.Types.ObjectId,
    //             ref: 'Position'
    //         },
    //         can_position_name: String,
    //         can_position_code: String

    //     }]
    // }]
    //version3
    data: [{
        des_career: { //目标职务
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Career'
        },
        des_career_name: String,
        career_code: String,
        is_des_position: {
            type: Boolean,
            default: true
        },
        plan_num: {
            type: Number,
            default: 0
        }, //计划人数 = 目标职位 计划人数之和
        // candidate_data: [{ //候选对象---去掉
        //     candidate: {
        //         type: mongoose.Schema.Types.ObjectId,
        //         ref: 'Position'
        //     },
        //     candidate_name: String,
        //     candidate_code: String

        // }],
        des_position_data: [{ //目标职位 while is_des_position ==true 时，取这个数组里的数据
            des_position: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Position'
            },
            des_position_name: String,
            des_position_code: String,
            plan_num: {
                type: Number,
                default: 0
            },
            can_position_data: [{ //候选对象
                can_position: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: 'Position'
                },
                can_position_name: String,
                can_position_code: String

            }]
        }]
    }]

})
DevelopeDirectSchema.plugin(valid);
DevelopeDirectSchema.index({
    client: 1,
    direct_name: 1
}, {
    unique: true,
    dropDups: true
}); //定义复合索引——唯一键
module.exports.DevelopeDirectSchema = DevelopeDirectSchema;
//人才培养清单 -数据来源配置
//@ 1.从人才池中而来  2.从上级提名中而来
DevelopeListConfigSchema = mongoose.Schema({
    client: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Client'
    },
    people: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'People'
    },
    data_type: {
        type: String,
        'enum': ['P', 'T'] //'P':数据来源：人才池 'T':推荐

    },
    people_name: String,
    people_no: String,
    company_name: String,
    ou_name: String,
    position_name: String,
    position: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Position'
    }
})
DevelopeListConfigSchema.plugin(valid);
DevelopeListConfigSchema.index({
    client: 1,
    people: 1,
    data_type: 1
}, {
    unique: true,
    dropDups: true
}); //定义复合索引——唯一键
module.exports.DevelopeListConfigSchema = DevelopeListConfigSchema;
//人才培养清单
DevelopeListSchema = mongoose.Schema({
    client: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Client'
    },
    people: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'People'
    },
    data_type: {
        type: String,
        'enum': ['P', 'T'] //'P':数据来源：人才池 'T':推荐

    },
    people_name: String,
    people_no: String,
    company_name: String,
    ou_name: String,
    position: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Position'
    },
    position_name: String,
    is_sure: { //通过这个字段来控制该人员是否加入确认培养清单
        type: Boolean,
        default: false
    },
    is_real_sure: { //通过这个字段来控制该人员是否加入确认培养计划清单
        type: Boolean,
        default: false
    },
})
DevelopeListSchema.plugin(valid);
DevelopeListSchema.index({
    client: 1,
    people: 1,
    data_type: 1
}, {
    unique: true,
    dropDups: true
}); //定义复合索引——唯一键
module.exports.DevelopeListSchema = DevelopeListSchema;
//人才培养计划  ---人才待培养清单中生成而来
DevelopePlanSchema = mongoose.Schema({
    client: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Client'
    },
    plan_name: String, //某某的培养计划,作为主键
    people: { //培养对象
        type: mongoose.Schema.Types.ObjectId,
        ref: 'People'
    },
    people_name: String,
    description: String, //培养计划描述
    period_start: Date, //周期开始日   
    period_end: Date, //周期结束日
    develope_direct: { //培养方向
        type: mongoose.Schema.Types.ObjectId,
        ref: 'DevelopeDirect'
    },
    des_career: { //目标职务
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Career'
    },
    des_career_name: String,
    des_position: { //目标职位
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Position'
    },
    des_position_name: String,
    //计划分解:
    plan_divide: [{ //周期开始 -- 周期结束  一对一
        develope_type: { //培养方式
            type: mongoose.Schema.Types.ObjectId,
            ref: 'DevelopeType'
        },
        type_name: String, //培养方式
        style_id: {
            type: mongoose.Schema.Types.ObjectId,

        },
        style_name: String, //培养手段
        learn_style: { //学习方式
            type: mongoose.Schema.Types.ObjectId,
            ref: 'LearnStyle'
        },
        learn_name: String, //方式名称
        check_style: { //评估方式
            type: mongoose.Schema.Types.ObjectId,
            ref: 'CheckStyle'
        },
        check_name: String, //方式名称
        plan_s: Date, //计划开始日
        plan_e: Date, //计划截至日
        //状态
        // status: {//0:未开始 //进行中  //已结束
        //     type: String,
        //     'enum': ['0', '1', '2']
        // },
        pass:{
            type: Boolean,
        }
    }],
    attachments: [{ //附件。 
        file: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'GridFile'
        },
        people: {
            type: mongoose.Schema.Types.ObjectId, //当前上传的人
            ref: 'People'
        },
    }],
    comment: String

})
DevelopePlanSchema.plugin(valid);
DevelopePlanSchema.index({
    client: 1,
    plan_name: 1
}, {
    unique: true,
    dropDups: true
}); //定义复合索引——唯一键
module.exports.DevelopePlanSchema = DevelopePlanSchema;
//强制分布历史表
//公司组合 + 周期   是唯一的
ForceDistributionHistroySchema = mongoose.Schema({
    client: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Client'
    },
    companys: [{ //强制分布的公司组合
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Company'
    }],
    period: [{ //周期
        type: mongoose.Schema.Types.ObjectId,
        ref: 'PeriodManagement'
    }]
})
ForceDistributionHistroySchema.plugin(valid);
module.exports.ForceDistributionHistroySchema = ForceDistributionHistroySchema;

//性格测试问卷--配置(客户可以选择的题目数和对应的答题时间)
MBTIConfigSchema = mongoose.Schema({
    items: [{
        num: { //题数
            type: String,
            required: true
        },
        need_time: { //大约需要的时间
            type: String,
            required: true
        },
    }],
    md_items: [{
        md_code: { //性格代码
            type: String,
        },
        md_name: { //性格结论
            type: String,
        },
        md_description: String, //性格描述
    }],
});
module.exports.MBTIConfigSchema = MBTIConfigSchema;

//性格测试问卷--维度和题库
MBTIQuestionBankSchema = mongoose.Schema({
    md_code1: { //外向-内向，感觉-直觉，思考-情感，计划-随性
        type: String,
        require: true,
    },
    md_code2: { //外向-内向，感觉-直觉，思考-情感，计划-随性
        type: String,
        require: true,
    },
    md_name1: { //名称
        type: String,
        require: true
    },
    md_name2: { //名称
        type: String,
        require: true
    },
    md_description: {
        type: String,
    },
    degree: [{
        name: { //名称
            type: String,
            required: true
        },
        low_value: { //低分
            type: Number,
            required: true
        },
        high_value: { //高分
            type: Number,
            required: true
        },
    }],
    qb: [{
        category: String, //一级题目
        q_num: Number, //分类下题目数
        qs: [{
            q_name: String,
            q_options: [{
                option: String,
                key: String,
            }],
        }]
    }],
    q_num: Number, //维度下的题目数
});
MBTIQuestionBankSchema.plugin(valid);
module.exports.MBTIQuestionBankSchema = MBTIQuestionBankSchema;

//性格测试问卷实例
MBTIQuestionInstanceSchema = mongoose.Schema({
    client: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Client'
    },
    company: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Company'
    },
    category: { //0,内部;1,外部
        type: String,
        'enum': ['0', '1'],
    },
    ou: { //被测试人部门
        type: mongoose.Schema.Types.ObjectId,
        ref: 'OrganizationUnit',
    },
    ou_name: String,
    position: { //被测试人职位
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Position',
    },
    position_name: String,
    people: { //被测试人
        type: mongoose.Schema.Types.ObjectId,
        ref: 'People',
    },
    people_name: String,
    gender: { //性别
        type: String,
    },
    age: String, //年龄
    email: String, //电子邮箱地址
    comment: String, //备注
    createDate: { //创建日期
        type: Date,
        default: new Date()
    },
    startDate: { //开始答题时间
        type: Date,
        default: new Date()
    },
    submitDate: { //提交时间
        type: Date,
        default: new Date()
    },
    status: { //状态, 0:未提交;1:已提交
        type: String,
        emun: ['0', '1'],
        default: '0',
    },
    qb: [{
        category: String, //一级题目
        qs: [{
            q_name: String,
            q_options: [{
                option: String,
                key: String,
            }],
            result: String,
        }]
    }],
    result: String, //测评结果
});
module.exports.MBTIQuestionInstanceSchema = MBTIQuestionInstanceSchema;
