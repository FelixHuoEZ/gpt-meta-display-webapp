# Display Subtitle PoC

这是给 `Meta Ray-Ban Display Web Apps` 路线准备的最小静态显示外壳。

相关说明：

- 总体路线: [../../DISPLAY_WEBAPP_POC.md](../../DISPLAY_WEBAPP_POC.md)
- 浏览版: [../../docs/display-webapp-poc.html](../../docs/display-webapp-poc.html)

本地预览：

```bash
cd webapp/display-subtitle-poc
python3 -m http.server 8008
```

打开：

```text
http://127.0.0.1:8008/index.html?demo=1
```

公开 HTTPS 测试 URL：

```bash
scripts/publish_display_webapp_trycloudflare.sh
```

这会把当前静态页暴露成一个临时 `trycloudflare` 地址，适合直接加到 `Meta AI -> App connections -> Web apps` 做设备侧 PoC。
