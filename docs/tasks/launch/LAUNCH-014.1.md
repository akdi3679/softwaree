# TASK ID: LAUNCH-014.1
# TITLE: Add i18n: Chinese Simplified (zh-CN)
# STATUS: pending
# DEPENDENCIES: LAUNCH-013.2
# ALLOWED FILES: product/apps/admin/src/i18n/zh-CN.json
# FORBIDDEN FILES: any other file
# OWNER: any
# ESTIMATED EFFORT: 3 minutes

## OBJECTIVE
Chinese for APAC market.

## REQUIRED IMPLEMENTATION

Create `product/apps/admin/src/i18n/zh-CN.json`:

```json
{
  "common": {
    "save": "保存",
    "cancel": "取消",
    "delete": "删除",
    "edit": "编辑",
    "search": "搜索",
    "loading": "加载中…",
    "error": "发生错误",
    "success": "成功",
    "confirm": "确认",
    "yes": "是",
    "no": "否",
    "today": "今天",
    "yesterday": "昨天",
    "thisWeek": "本周",
    "thisMonth": "本月"
  },
  "nav": {
    "dashboard": "仪表板",
    "projects": "项目",
    "users": "用户",
    "patients": "患者",
    "samples": "样本",
    "appointments": "预约",
    "audit": "审计日志",
    "modules": "模块",
    "settings": "设置",
    "help": "帮助",
    "logout": "退出登录"
  },
  "patients": {
    "title": "患者",
    "addPatient": "添加患者",
    "name": "姓名",
    "phone": "电话",
    "email": "邮箱",
    "dateOfBirth": "出生日期",
    "archive": "归档",
    "search": "搜索患者…"
  },
  "appointments": {
    "title": "预约",
    "today": "今日预约",
    "newAppointment": "新预约",
    "patient": "患者",
    "doctor": "医生",
    "time": "时间",
    "duration": "时长",
    "status": "状态",
    "checkIn": "签到",
    "cancel": "取消"
  },
  "samples": {
    "title": "样本",
    "intake": "样本接收",
    "sampleId": "样本ID",
    "type": "类型",
    "submittedBy": "提交人",
    "receivedAt": "接收时间",
    "status": "状态",
    "start": "开始测试",
    "results": "结果",
    "issueReport": "出具报告"
  },
  "errors": {
    "notFound": "未找到",
    "forbidden": "禁止",
    "unauthorized": "未授权",
    "validation": "输入无效",
    "network": "网络错误",
    "serverError": "服务器错误"
  },
  "auth": {
    "login": "登录",
    "signup": "注册",
    "email": "邮箱",
    "password": "密码",
    "forgotPassword": "忘记密码？",
    "verifyEmail": "验证邮箱"
  }
}
```

## TESTS

```bash
cd product
test -f apps/admin/src/i18n/zh-CN.json || { echo "FAIL"; exit 1; }
python3 -c "import json; json.load(open('apps/admin/src/i18n/zh-CN.json'))" || { echo "FAIL: invalid"; exit 1; }
grep -q "保存" apps/admin/src/i18n/zh-CN.json || { echo "FAIL: not translated"; exit 1; }
echo "OK"
```
