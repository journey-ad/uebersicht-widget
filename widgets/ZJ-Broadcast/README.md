## ZJ-Broadcast

### `config.json`配置说明

由于b站防爬策略限制，目前获取动态接口需携带Cookie访问

在`cookie`字段中配置`SESSDATA`的值，注意一些敏感操作会刷新这个值，建议使用小号的cookie信息

在`defaultType`字段中配置某个显示器默认使用哪个组，显示器ID可以通过Übersicht调试工具的`location.pathname`获取


### 自定义通知图标

桌面通知使用[terminal-notifier](https://github.com/julienXX/terminal-notifier)+自定义图标实现

1. 使用`iconutil`工具生成icns图标，[参考](https://stackoverflow.com/questions/12306223/how-to-manually-create-icns-files-using-iconutil)
2. 将图标放置在`terminal-notifier.app/Contents/Resources/icon.icns`
3. 修改`terminal-notifier.app/Contents/Info.plist`
    - `CFBundleIdentifier`和`CFBundleName`字段的值改成另一个唯一值
    - `CFBundleIconFile`的值改为`icon`，也即icns图标的文件名部分
4. app改为所需名字，运行一次并允许通知权限，这个名字就是消息中心的应用程序名
