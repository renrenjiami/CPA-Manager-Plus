# CPAMP v1.13.1 最小补丁维护规则

当前分支 codex/cpamp-v1.13.1-minimal；基准 v1.13.1。

1. local-performance-patches/01-web-delivery.patch：拆包、路由/语言懒加载及配套测试。
2. local-performance-patches/02-monitoring-price-and-refresh.patch：价格表按需加载、正费用显示fallback、慢刷新保护、100条事件分页。
3. local-performance-patches/03-background-write-coordination.patch：后台补算共享写入门控。
4. local-performance-patches/04-startup-regression-tests.patch：10万条数据启动时不重建v1索引且保留已有索引的测试。

migrate.go 和 aggregate_query_plan_test.go 已恢复上游。不要重新引入 ensureUsageEventMonitoringIndexes，也不要在升级时删除数据库现有v1/v2索引。
上线没有删除任何索引。门控与v1索引的生产规模冷/热A/B仍未完成，不把“暂留”说成“证明必需”。

部署配置独立维护：Nginx哈希资产 immutable，HTML no-cache 条件校验；不发Clear-Site-Data；手机和桌面统一拆包入口，不恢复CriOS强制mobile.html。
管理程序内嵌的上游单文件 management.html 仍保留，与公开 /console/ 分发是两回事。

CPA继续使用现有最小TypeBox schemafix，本次不更新CPA/Keeper版本。

零费用计价就绪判定仍是独立待办：不为此扩充当前补丁。只有明确后端契约与回归覆盖后才替换 totalCost>0 fallback。
