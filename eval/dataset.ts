/**
 * 评测集：自写 JD + 虚构候选人 + 人工标注的硬性关键词。
 * 标注口径：面试官会当成门槛来问的词。软性描述（沟通、责任心）不标。
 */
export type EvalCase = {
  id: string;
  title: string;
  jd: string;
  resume: string;
  must: string[];
  nice: string[];
};

const CANDIDATE_TEST = `张伟，3 年软件测试经验，主要做智能硬件与 App 的功能测试。
负责 5 个版本的回归测试，累计执行用例 1800+，提交缺陷 200+，跟踪至关闭。
使用 Python 编写过接口自动化脚本，熟悉 Linux 与抓包工具。
参与过性能测试，用 JMeter 做过并发压测。`;

const CANDIDATE_BACKEND = `李娜，4 年后端开发经验，主要做电商订单系统。
负责订单履约服务，日均处理 30 万单，用 Java 和 Spring Boot。
做过库存扣减的分布式事务改造，用 Redis 缓存热点数据，Kafka 异步削峰。
熟悉 MySQL 索引优化，参与过微服务拆分。`;

const CANDIDATE_FRONTEND = `王强，3 年前端开发经验，主要做 B 端后台。
用 React 和 TypeScript 开发过 20 多个页面，做过组件库封装。
熟悉 Webpack 构建优化，把首屏时间从 4 秒降到 1.8 秒。
写过小程序端的活动页，做过 H5 适配。`;

export const CASES: EvalCase[] = [
  {
    id: "qa-iot",
    title: "测试工程师 · 智能硬件",
    must: ["功能测试", "兼容性测试", "回归测试", "测试用例", "缺陷管理", "Linux", "Python", "接口测试", "自动化测试"],
    nice: ["Postman", "JMeter"],
    resume: CANDIDATE_TEST,
    jd: `岗位职责：
1. 负责智能硬件产品的功能测试、兼容性测试与回归测试；
2. 编写测试用例并执行，跟踪缺陷直至关闭；
3. 参与自动化测试脚本的编写与维护。
任职要求：
1. 本科及以上学历，2 年以上软件测试经验；
2. 熟悉测试用例设计方法，掌握缺陷管理流程；
3. 熟悉 Linux 常用命令，能使用 Python 编写简单脚本；
4. 有接口测试经验，了解 Postman、JMeter 者优先；
5. 具备良好的沟通能力与团队协作意识。`,
  },
  {
    id: "qa-web",
    title: "测试工程师 · Web 平台",
    must: ["功能测试", "接口测试", "测试用例", "缺陷管理", "SQL", "Linux"],
    nice: ["Selenium", "JMeter", "Postman"],
    resume: CANDIDATE_TEST,
    jd: `岗位职责：
1. 负责 Web 平台的功能测试与接口测试；
2. 根据需求文档设计测试用例，执行并跟踪缺陷；
3. 维护测试环境，配合开发定位线上问题。
任职要求：
1. 3 年以上测试经验，熟悉软件测试流程；
2. 熟练编写测试用例，掌握缺陷管理工具；
3. 会写 SQL 查询，能独立造数据；
4. 熟悉 Linux 环境，能看日志定位问题；
5. 了解 Selenium 或 JMeter 者加分。`,
  },
  {
    id: "be-order",
    title: "后端工程师 · 订单交易",
    must: ["Java", "微服务", "分布式", "Redis", "Kafka", "MySQL", "服务治理", "事务", "索引"],
    nice: ["Docker", "Kubernetes", "高并发"],
    resume: CANDIDATE_BACKEND,
    jd: `岗位职责：
1. 负责订单交易链路的后端开发与稳定性保障；
2. 参与微服务拆分与服务治理；
3. 优化核心接口性能，支撑大促流量。
任职要求：
1. 3 年以上 Java 后端经验，熟悉 Spring Boot；
2. 熟悉分布式系统设计，了解分布式事务；
3. 熟练使用 Redis、Kafka 等中间件；
4. 熟悉 MySQL，具备索引与慢查询优化经验；
5. 有高并发场景经验者优先；
6. 了解 Docker、Kubernetes 者加分。`,
  },
  {
    id: "be-platform",
    title: "后端工程师 · 基础平台",
    must: ["Java", "微服务", "数据库", "缓存", "消息队列", "Linux", "SQL", "服务治理"],
    nice: ["Docker", "Kubernetes", "服务治理"],
    resume: CANDIDATE_BACKEND,
    jd: `岗位职责：
1. 负责基础平台服务的开发与维护；
2. 设计并实现内部 API，保障服务稳定性；
3. 参与线上问题排查与容量评估。
任职要求：
1. 熟练掌握 Java，理解 JVM 基础；
2. 有微服务架构经验，了解服务治理；
3. 熟悉数据库设计与 SQL 优化；
4. 熟悉缓存与消息队列的使用场景；
5. 熟悉 Linux 常用命令，能独立排查线上问题；
6. 了解 Docker 或 Kubernetes 优先。`,
  },
  {
    id: "fe-b",
    title: "前端工程师 · B 端后台",
    must: ["React", "TypeScript", "组件库", "Webpack", "CSS"],
    nice: ["小程序", "H5", "响应式"],
    resume: CANDIDATE_FRONTEND,
    jd: `岗位职责：
1. 负责 B 端后台系统的前端开发；
2. 参与组件库建设与维护；
3. 优化页面性能与交互体验。
任职要求：
1. 3 年以上前端经验，熟练使用 React；
2. 熟悉 TypeScript，有组件化开发经验；
3. 熟悉 Webpack 等构建工具；
4. 扎实的 CSS 功底，能还原设计稿；
5. 有小程序或 H5 开发经验者优先。`,
  },
  {
    id: "de-etl",
    title: "数据工程师 · 离线数仓",
    must: ["SQL", "数据仓库", "ETL", "调度"],
    nice: ["Hive", "Spark", "Flink", "指标体系"],
    resume: CANDIDATE_BACKEND,
    jd: `岗位职责：
1. 负责离线数仓的分层建模与 ETL 开发；
2. 支撑业务方的取数与报表需求；
3. 优化任务调度与数据质量。
任职要求：
1. 熟练使用 SQL，能写复杂查询；
2. 有数据仓库建模经验，理解分层设计；
3. 熟悉 ETL 流程与调度工具；
4. 熟悉 Hive、Spark 者优先；
5. 了解 Flink 或指标体系加分。`,
  },
];
