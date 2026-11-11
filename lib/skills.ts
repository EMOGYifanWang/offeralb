export type Skill = { name: string; aliases: string[] };

/**
 * 技能词典：只收录「写进 JD 里能被当成硬性要求」的词。
 * 命中词典的术语优先级高于分词结果，因为分词会把「功能测试」切成「功能 / 测试」。
 */
export const SKILLS: Skill[] = [
  // 测试
  { name: "功能测试", aliases: ["功能测试", "功能性测试"] },
  { name: "自动化测试", aliases: ["自动化测试", "自动化"] },
  { name: "性能测试", aliases: ["性能测试", "压测", "压力测试"] },
  { name: "接口测试", aliases: ["接口测试", "API 测试", "API测试"] },
  { name: "兼容性测试", aliases: ["兼容性测试", "兼容性"] },
  { name: "回归测试", aliases: ["回归测试", "回归"] },
  { name: "安全测试", aliases: ["安全测试", "渗透测试"] },
  { name: "测试用例", aliases: ["测试用例", "用例设计", "用例"] },
  { name: "缺陷管理", aliases: ["缺陷管理", "缺陷跟踪", "bug 管理", "bug管理"] },
  { name: "测试计划", aliases: ["测试计划", "测试方案", "测试策略"] },
  { name: "单元测试", aliases: ["单元测试"] },
  { name: "集成测试", aliases: ["集成测试"] },
  { name: "验收测试", aliases: ["验收测试", "UAT"] },
  { name: "持续集成", aliases: ["持续集成", "CI/CD", "CI"] },
  { name: "敏捷开发", aliases: ["敏捷", "Scrum"] },
  { name: "质量保证", aliases: ["质量保证", "QA"] },
  { name: "灰度发布", aliases: ["灰度", "上线发布"] },

  // 工具与平台
  { name: "Jira", aliases: ["Jira"] },
  { name: "禅道", aliases: ["禅道", "ZenTao"] },
  { name: "TestRail", aliases: ["TestRail"] },
  { name: "Postman", aliases: ["Postman"] },
  { name: "JMeter", aliases: ["JMeter"] },
  { name: "LoadRunner", aliases: ["LoadRunner"] },
  { name: "Selenium", aliases: ["Selenium"] },
  { name: "Appium", aliases: ["Appium"] },
  { name: "Pytest", aliases: ["Pytest", "pytest"] },
  { name: "Robot Framework", aliases: ["Robot Framework"] },
  { name: "Fiddler", aliases: ["Fiddler"] },
  { name: "Charles", aliases: ["Charles"] },
  { name: "Wireshark", aliases: ["Wireshark", "抓包"] },
  { name: "Git", aliases: ["Git", "GitLab", "GitHub"] },
  { name: "Jenkins", aliases: ["Jenkins"] },
  { name: "Docker", aliases: ["Docker"] },
  { name: "Kubernetes", aliases: ["Kubernetes", "K8s"] },
  { name: "Linux", aliases: ["Linux", "Shell"] },
  { name: "MySQL", aliases: ["MySQL"] },
  { name: "SQL", aliases: ["SQL"] },
  { name: "Python", aliases: ["Python"] },
  { name: "Java", aliases: ["Java"] },
  { name: "JavaScript", aliases: ["JavaScript", "JS"] },
  { name: "TypeScript", aliases: ["TypeScript", "TS"] },
  { name: "Redis", aliases: ["Redis"] },
  { name: "Kafka", aliases: ["Kafka"] },
  { name: "HTTP", aliases: ["HTTP", "HTTPS"] },
  { name: "TCP/IP", aliases: ["TCP/IP", "TCP"] },
  { name: "REST", aliases: ["REST", "RESTful"] },

  // 后端与架构
  { name: "微服务", aliases: ["微服务"] },
  { name: "分布式", aliases: ["分布式"] },
  { name: "高并发", aliases: ["高并发"] },
  { name: "消息队列", aliases: ["消息队列", "MQ"] },
  { name: "缓存", aliases: ["缓存"] },
  { name: "数据库", aliases: ["数据库"] },
  { name: "索引", aliases: ["索引"] },
  { name: "事务", aliases: ["事务"] },
  { name: "服务治理", aliases: ["服务治理"] },

  // 前端
  { name: "React", aliases: ["React"] },
  { name: "Vue", aliases: ["Vue"] },
  { name: "Webpack", aliases: ["Webpack", "Vite"] },
  { name: "小程序", aliases: ["小程序"] },
  { name: "H5", aliases: ["H5"] },
  { name: "CSS", aliases: ["CSS", "HTML"] },
  { name: "组件库", aliases: ["组件库", "组件化"] },
  { name: "响应式", aliases: ["响应式", "适配"] },

  // 数据
  { name: "数据仓库", aliases: ["数据仓库", "数仓"] },
  { name: "ETL", aliases: ["ETL"] },
  { name: "Hive", aliases: ["Hive"] },
  { name: "Spark", aliases: ["Spark"] },
  { name: "Flink", aliases: ["Flink"] },
  { name: "指标体系", aliases: ["指标体系", "数据指标"] },
  { name: "A/B 测试", aliases: ["A/B", "AB 测试", "AB测试"] },

  // 产品与协作
  { name: "需求分析", aliases: ["需求分析", "需求评审"] },
  { name: "竞品分析", aliases: ["竞品分析"] },
  { name: "用户调研", aliases: ["用户调研", "用户访谈"] },
  { name: "PRD", aliases: ["PRD", "产品需求文档"] },
  { name: "数据埋点", aliases: ["埋点"] },
  { name: "用户增长", aliases: ["用户增长", "增长"] },
];
