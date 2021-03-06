    //定义窗口尺寸
    $('.layui-layer-page').css({
        'width': '900px'
    });

    //左测菜单切换效果
    $(".bt-w-menu p").click(function () {
        $(this).addClass('bgw').siblings().removeClass('bgw')
        clear_task()
    });
    window.aoaostar_task = null

    //第一次打开窗口时调用
    if ($('#aoaostar-app').length == 0) {
        clear_task()
    }

    function clear_task() {
        clearTimeout(window.aoaostar_task)
    }

    /**
     * 插件交互对象
     * 您的所有JS代码可以写在里面
     * 若不习惯JS的面向对象编程，可删除此对象，使用传统函数化的方式编写
     * */
    var aliyundrive_uploader = {
        //构造概览内容
        get_index: function () {
            request_get('/aliyundrive_uploader/get_sever_status', null, function (res) {
                let info = {}
                if (res.status == true) {
                    info.status = true
                    info.status_text = '开启'
                    info.status_icon = 'glyphicon-play'
                    info.status_color = '#20a53a'
                    info.btn = `
                                <button class="btn btn-default btn-sm" onclick="aliyundrive_uploader.set_server_status('stop')">停止</button>
                                <button class="btn btn-default btn-sm" onclick="aliyundrive_uploader.set_server_status('restart')">重启</button>
                            `
                } else {
                    info.status = false
                    info.status_text = '停止'
                    info.status_icon = 'glyphicon-stop'
                    info.status_color = '#ff001e'
                    info.btn =
                        `
                                <button class="btn btn-default btn-sm" onclick="aliyundrive_uploader.set_server_status('start')">启动</button>
                                <button class="btn btn-default btn-sm" onclick="aliyundrive_uploader.set_server_status('restart')">重启</button>`
                }
                info.btn += `
                                <button class="btn btn-default btn-sm" onclick="aliyundrive_uploader.clear_task('all')">清除所有任务</button>
                                <button class="btn btn-default btn-sm" onclick="aliyundrive_uploader.clear_task('completed')">清除已上传任务</button>
                                <button class="btn btn-default btn-sm" onclick="aliyundrive_uploader.clear_task('failure')">清除失败任务</button>
                                <button class="btn btn-default btn-sm" onclick="aliyundrive_uploader.clear_task('log')">清除日志</button>
                                <button class="btn btn-default btn-sm" onclick="aliyundrive_uploader.check_update()">检查更新</button>
                `

                let html = `<div class="soft-man-con bt-form">
                            <p class="status">当前状态：<span>${info.status_text}</span>
                            <span style="color: ${info.status_color}; margin-left: 3px;" class="glyphicon glyphicon ${info.status_icon}"></span>
                            </p>
                            <div class="sfm-opt">${info.btn}</div>
                        </div>`
                $('.plugin_body').html(html);
            })
        },
        get_logs: function (p) {
            if (p == undefined) p = 1;
            var request = request_plugin('aliyundrive_uploader', 'get_logs', {
                p: p,
                rows: 100,
                callback: 'aliyundrive_uploader.get_logs'
            }, function (rdata) {
                var log_body = $("#aoaostar-exec_log").text();
                list = rdata.data;
                let last_id = $('#aoaostar-exec_log').data('last-id');
                if (list.length == 0 && $('#aoaostar-exec_log').length === 0) {
                    var my_body = `<div class="aoaostar-taskcon">
                                        <textarea readonly id="aoaostar-exec_log" data-last-id='0'>当前无执行日志</textarea>
                                    </div>`
                    $('.plugin_body').html(my_body);
                    return;
                }
                if (list.length <= 0 || list[0]['id'] <= last_id) {
                    return;
                }
                for (let i = list.length - 1; i >= 0; i--) {
                    if (last_id >= list[i]['id']) {
                        continue;
                    }
                    log_body += list[i]['content'] + "\n"
                }

                var my_body = `<div class="aoaostar-taskcon">
                                    <textarea readonly id="aoaostar-exec_log" data-last-id='${list[0]['id']}'>${log_body}</textarea>
                                </div>`
                $('.plugin_body').html(my_body);
                $("#aoaostar-exec_log").scrollTop($("#aoaostar-exec_log")[0].scrollHeight);
            });
            request.then((res) => {
                window.aoaostar_task = setTimeout(() => {
                    aliyundrive_uploader.get_logs(p)
                }, 500)
            })
        },
        echo_task_html: function (rdata) {
            let list = rdata.data
            let status_text = {
                '-1': '上传失败',
                '0': '未上传',
                '1': '已上传',
                '2': '正在上传',
            }
            if (list.length == 0) {
                var my_body = `<div class="alert alert-success" role="alert">当前无任务运行</div>`
                $('.plugin_body').html(my_body);
                return;
            }
            let html = ''

            for (let i = 0; i < list.length; i++) {
                html += `<div class="panel panel-default aoaostar-panel">
        <div class="panel-heading">
            <h5 class="panel-title">
                <a class="aoaostar-panel-task-change" data-task-id='${list[i]['id']}' data-toggle="collapse" data-parent="#aoaostar-panel-accordion"
                href="#collapse_${list[i]['id']}">【${status_text[list[i]['status']]}】${list[i]['filepath']}</a>
            </h5>
        </div>
        <div id="collapse_${list[i]['id']}" class="panel-collapse collapse ${i == 0 ? 'in' : ''}">
            <div class="panel-body">
                <div class="aoaostar-taskcon">
                    <textarea readonly id="aoaostar-exec_log-${list[i]['id']}">正在获取执行日志</textarea>
                </div>
            </div>
        </div>
    </div>`
            }

            var my_body = `
<div class="panel-group" id="aoaostar-panel-accordion" data-task-id='${list[0]['id']}'>
${html}
</div><div class="aoaostar-page filePage pagination page pd15">${rdata.page}</div>`
            if ($('#aoaostar-panel-accordion').html() == html) {
                return;
            }
            if ($('#aoaostar-panel-accordion').data('task-id') !== list[0]['id']) {
                $('.plugin_body').html(my_body);
            }
            $('.aoaostar-panel-task-change').click(function (e) {
                console.log($(this).data('task-id'));
                $('#aoaostar-panel-accordion').data('task-id', $(this).data('task-id'))
                aliyundrive_uploader.get_task_log($(this).data('task-id'))
            })

            let task_id = $('#aoaostar-panel-accordion').data('task-id')
            return this.get_task_log(task_id)
        },
        get_task_log: function (task_id) {
            return request_plugin('aliyundrive_uploader', 'get_task_log', {
                'id': task_id,
            }, function (rdata) {
                if (rdata.status) {
                    let content_list = rdata.data;
                    let content = '';
                    for (let i = 0; i < content_list.length; i++) {
                        content += content_list[i]['content'] + '\n'
                    }
                    $('#aoaostar-exec_log-' + task_id).html(content)
                } else {
                    $('#aoaostar-exec_log-' + task_id).html(rdata.msg)
                }
                $('#aoaostar-exec_log-' + task_id).scrollTop($(
                    '#aoaostar-exec_log-' + task_id)[0].scrollHeight)
            })
        },
        get_tasks: function (p) {
            if (p == undefined) p = 1;

            var request = request_plugin('aliyundrive_uploader', 'get_task', {
                p: p,
                rows: 100,
                callback: 'aliyundrive_uploader.get_task'
            }, (rdata) => {
                let request = this.echo_task_html(rdata)
                if (request != null) {
                    this.echo_task_html(rdata).then((res) => {
                        window.aoaostar_task = setTimeout(() => {
                            aliyundrive_uploader.get_tasks()
                        }, 2000)
                    })
                }
            });
        },
        get_completed_tasks: function (p) {
            if (p == undefined) p = 1;

            var request = request_plugin('aliyundrive_uploader', 'get_completed_tasks', {
                p: p,
                rows: 100,
                callback: 'aliyundrive_uploader.get_completed_tasks'
            }, (rdata) => {
                this.echo_task_html(rdata)
            });

        },
        get_dir: function (p, path) {
            if (p == undefined) p = 1;
            if (path == undefined) {
                path = getCookie('Path');
            }
            setCookie('Path', path);

            request_post('/files?action=GetDir', {
                p: p,
                showRow: 100,
                path: path,
                tojs: 'aliyundrive_uploader.get_dir',
            }, function (rdata) {
                let filepath = ''
                let file_body_list_body = '';
                $('.plugin_body').html($('#file_body').html());
                $('#aoaostar-page').html(rdata.PAGE);
                let path_list = rdata.PATH.split('/')
                for (let i = 0; i < path_list.length; i++) {
                    let dir_name = path_list[i];
                    if (i > 0 && dir_name === '') {
                        break;
                    }
                    let path_list_tmp = path_list.slice(0, parseInt(i) + 1)

                    let path_name = path_list_tmp.join('/');
                    if (i == 0) {
                        path_name = '/'
                        dir_name = '根目录'
                    }
                    filepath +=
                        `<li><a title="${path_name}" onclick="aliyundrive_uploader.get_dir(1,'${path_name}')">${dir_name}</a></li>`
                }

                $('#filepath').html(filepath);
                for (let i = 0; i < rdata.DIR.length; i++) {
                    let file_attributes = rdata.DIR[i].split(';');
                    let filename = file_attributes[0];
                    let file_size = file_attributes[1];
                    let file_date = file_attributes[2];
                    let path_name = rdata.PATH + '/' + filename;
                    file_body_list_body += `<tr>
                        <td class="cursor" onclick="aliyundrive_uploader.get_dir(1,'${path_name}')"><span
                                class="ico ico-folder"></span><span>${filename}</span></td>
                        <td>${ToSize(file_size)}</td>
                        <td>${getLocalTime(file_date)}</td>
                        <td class="text-right"><a class="btlink" onclick="aliyundrive_uploader.create_upload_task('${path_name}')">上传</a></td>
                    </tr>`
                }
                for (let i = 0; i < rdata.FILES.length; i++) {
                    let file_attributes = rdata.FILES[i].split(';');
                    let filename = file_attributes[0];
                    let file_size = file_attributes[1];
                    let file_date = file_attributes[2];
                    let path_name = rdata.PATH + '/' + filename;
                    file_body_list_body += `<tr>
                        <td class="cursor"><span
                                class="ico ico-file"></span><span>${filename}</span></td>
                        <td>${ToSize(file_size)}</td>
                        <td>${getLocalTime(file_date)}</td>
                        <td class="text-right"><a class="btlink" onclick="aliyundrive_uploader.create_upload_task('${path_name}')">上传</a></td>
                    </tr>`
                }
                $('#file_body_list').html(file_body_list_body);
            });

        },
        back_path: function () {
            let path = getCookie('Path');
            let tmp = path.slice(0, path.lastIndexOf('/'))
            console.log(tmp)
            if (tmp == '') {
                tmp = '/'
            }
            this.get_dir(1, tmp)
        },

        //设置API
        get_api: function () {
            $.get('/plugin?action=a&s=get_config&name=aliyundrive_uploader', function (config) {
                if (!config) {
                    config = {
                        "REFRESH_TOKEN": "refresh_token",
                        "DRIVE_ID": "drive_id",
                        "ROOT_PATH": "root",
                        "FILE_PATH": "/www/wwwroot/default",
                        "MULTITHREADING": false,
                        "MAX_WORKERS": 5,
                        "CHUNK_SIZE": 104857600,
                        "RESUME": false,
                        "OVERWRITE": false,
                        "RETRY": 0,
                        "RESIDENT": true
                    }
                }
                var apicon =
                    '<div class="bingfa mtb15">\
                            <p><span class="span_tit"> </span><a class="btn btn-success btm-xs" style="margin-left: 4px; margin-bottom: 10px" href="https://www.aliyundrive.com" target="_blank">注册账号</a></p>\
                            <p>\
                                <span class="span_tit">REFRESH_TOKEN：</span>\
                                <input placeholder="服务名称" style="width: 300px;" type="text" name="REFRESH_TOKEN" value="' +
                    config.REFRESH_TOKEN + '">  *阿里云盘刷新的token \
                                <a href="https://github.com/Hidove/aliyundrive-uploader/" target="_blank" class="btlink">[帮助]</a>\
                            </p>\
                            <p>\
                                <span class="span_tit">驱动ID：</span>\
                                <input style="width: 300px;" type="text" name="DRIVE_ID" value="' + config.DRIVE_ID + '">  *阿里云盘驱动ID\
                            </p>\
                            <p>\
                                <span class="span_tit">阿里云盘目录：</span>\
                                <input style="width: 300px;" type="text" name="ROOT_PATH" value="' + config.ROOT_PATH + '">   *需要上传到的阿里云盘目录\
                            </p>\
                            <p>\
                                <span class="span_tit">是否启用多线程：</span>\
                                <input class="btswitch btswitch-ios" id="MULTITHREADING" type="checkbox">\
                                <label class="btswitch-btn" for="MULTITHREADING"></label>\
                            </p>\
                            <p>\
								<span class="span_tit">最大线程数：</span>\
								<input placeholder="请输入最大线程数" style="width: 300px;" type="number" name="MAX_WORKERS" value="' + config
                    .MAX_WORKERS + '">   *线程池最大线程数，请根据自己机器填写\
							</p>\
                            <p>\
								<span class="span_tit">分块上传大小：</span>\
								<input placeholder="请输入分块上传大小" style="width: 300px;" type="number" name="CHUNK_SIZE" value="' + config
                    .CHUNK_SIZE +
                    '">   *分块上传大小，请根据自己机器填写，单位：字节\
							</p>\
                            <p>\
                                <span class="span_tit">断点续传：</span>\
                                <input class="btswitch btswitch-ios" id="RESUME" type="checkbox">\
                                <label class="btswitch-btn" for="RESUME"></label>   *断点续传，分块续传\
                            </p>\
                            <p>\
                                <span class="span_tit">覆盖同名文件：</span>\
                                <input class="btswitch btswitch-ios" id="OVERWRITE" type="checkbox">\
                                <label class="btswitch-btn" for="OVERWRITE" ></label> *覆盖同名文件，会将原文件放入回收站\
                            </p>\
                            <p>\
                                <span class="span_tit">失败重试次数：</span>\
                                <input placeholder="请输入保存路径" style="width: 300px;" type="number" name="RETRY" value="' +
                    config
                    .RETRY + '">   *上传出错时重试的次数\
                            </p>\
                            <p>\
                                <span class="span_tit">常驻运行：</span>\
                                <input class="btswitch btswitch-ios" id="RESIDENT" type="checkbox">\
                                <label class="btswitch-btn" for="RESIDENT" ></label> *使上传工具后台常驻运行\
                            </p>\
                            <p>\
		                    <span class="span_tit">*</span>\
		                    <span class="tip">\
                            如不能使用，请在github留言。带来不便敬请谅解！\
                            </span>\
                            </p>\
                            <div class="submit-btn">\
                                <button type="button" class="btn btn-danger btn-sm bt-cancel">取消</button>\
                                <button class="btn btn-success btn-sm" onclick="aliyundrive_uploader.set_api()">保存</button>\
                            </div>\
                            </div>';
                let i = layer.open({
                    type: 1,
                    area: "700px",
                    title: "阿里云盘API设置",
                    closeBtn: 2,
                    shift: 5,
                    shadeClose: false,
                    content: apicon
                });
                if (config.MULTITHREADING) {
                    $('#MULTITHREADING').attr("checked", true);
                }
                if (config.RESUME) {
                    $('#RESUME').attr("checked", true);
                }
                if (config.OVERWRITE) {
                    $('#OVERWRITE').attr("checked", true);
                }
                if (config.RESIDENT) {
                    $('#RESIDENT').attr("checked", true);
                }

                $(".bt-cancel").click(function () {
                    layer.close(i)
                });
            });
        },

        //提交API
        set_api: function () {
            var data = {
                REFRESH_TOKEN: $("input[name='REFRESH_TOKEN']").val(),
                DRIVE_ID: $("input[name='DRIVE_ID']").val(),
                ROOT_PATH: $("input[name='ROOT_PATH']").val(),
                MAX_WORKERS: $("input[name='MAX_WORKERS']").val(),
                CHUNK_SIZE: $("input[name='CHUNK_SIZE']").val(),
                RETRY: $("input[name='RETRY']").val(),
                MULTITHREADING: $("#MULTITHREADING").is(':checked'),
                RESUME: $("#RESUME").is(':checked'),
                OVERWRITE: $("#OVERWRITE").is(':checked'),
                RESIDENT: $("#RESIDENT").is(':checked'),
            }
            var loadT = layer.msg('正在校验...', {
                icon: 16,
                time: 0,
                shade: [0.3, '#000']
            });

            request_plugin('aliyundrive_uploader', 'set_config', data, function (rdata) {
                layer.close(loadT);
                layer.msg(rdata.msg, {
                    icon: rdata.status ? 1 : 2
                });
                if (rdata.status) {
                    layer.close(i);
                    aliyundrive_uploader.get_dir()
                }
            })
        },
        create_upload_task: function (filepath) {
            var data = {
                realpath: filepath,
            }
            var loadT = layer.msg('正在校验...', {
                icon: 16,
                time: 0,
                shade: [0.3, '#000']
            });
            request_plugin('aliyundrive_uploader', 'create_upload_task', data, function (rdata) {
                layer.close(loadT);
                layer.msg(rdata.msg, {
                    icon: rdata.status ? 1 : 2
                });
                if (rdata.status) {
                    layer.close(i);
                    aliyundrive_uploader.get_dir()
                }
            })
        },
        set_server_status: function (type) {
            var serverName = 'aliyundrive_uploader'
            var msg = lan.bt[type];
            switch (type) {
                case 'start':
                    typeName = '启动';
                    break;
                case 'stop':
                    typeName = '停止';
                    break;
                case 'restart':
                    typeName = '重启';
                    break;
            }
            bt.confirm({
                msg: lan.get('service_confirm', [msg, serverName]),
                title: typeName + serverName + '服务'
            }, function () {
                var load = bt.load(lan.get('service_the', [msg, serverName]))
                request_post('/aliyundrive_uploader/set_server_status', {
                    type: type,
                }, function (res) {
                    load.close();
                    var f = res.status ? lan.get('service_ok', [serverName, msg]) : lan.get(
                        'service_err', [serverName, msg]);
                    bt.msg({
                        msg: f,
                        icon: res.status
                    })

                    if (res.status) {
                        setTimeout(function () {
                            //window.location.reload()
                            aliyundrive_uploader.get_index()
                        }, 1000)
                    } else {
                        bt.msg(res);
                    }
                })
            })
        },
        clear_task: function (type) {
            switch (type) {
                case 'all':
                    typeName = '清除全部任务';
                    break;
                case 'completed':
                    typeName = '清除已上传任务';
                    break;
                case 'failure':
                    typeName = '清除失败任务';
                    break;
                case 'log':
                    typeName = '清除日志';
                    break;
            }
            bt.confirm({
                msg: '您真的要' + typeName,
                title: typeName
            }, function () {
                var load = bt.load('正在' + typeName)
                request_post('/aliyundrive_uploader/clear_task', {
                    type: type,
                }, function (res) {
                    load.close();
                    var f = res.status ? typeName + '执行成功' : typeName + '执行失败';
                    bt.msg({
                        msg: f,
                        icon: res.status
                    })

                    if (res.status) {
                        setTimeout(function () {
                            //window.location.reload()
                            aliyundrive_uploader.get_index()
                        }, 1000)
                    } else {
                        bt.msg(res);
                    }
                })
            })
        },
        update: function () {

            bt.confirm({
                msg: '确定要更新吗？',
                title: '阿里云盘上传工具更新'
            }, function () {
                var loadT = layer.msg('正在更新中...', {
                    icon: 16,
                    time: 0,
                    shade: [0.3, '#000']
                });
                request_plugin('aliyundrive_uploader', 'update', {}, function (rdata) {
                    layer.close(loadT);
                    layer.msg(rdata.msg, {
                        icon: rdata.status ? 1 : 2
                    });
                    if (rdata.status) {
                        layer.close(i);
                        window.location.reload()
                    }
                })
            })
        },
        check_update: function () {
            var loadT = layer.msg('正在检查更新中...', {
                icon: 16,
                time: 0,
                shade: [0.3, '#000']
            });
            request_plugin('aliyundrive_uploader', 'check_update', {}, function (rdata) {
                layer.close(loadT);
                if (rdata.status) {
                    bt.confirm({
                        msg: rdata.msg + '<br/>确定要更新吗？',
                        title: '阿里云盘上传工具更新'
                    }, function () {
                        var load2 = layer.msg('正在更新中...', {
                            icon: 16,
                            time: 0,
                            shade: [0.3, '#000']
                        });
                        request_plugin('aliyundrive_uploader', 'update', {}, function (rdata) {
                            layer.close(load2);
                            layer.msg(rdata.msg, {
                                icon: rdata.status ? 1 : 2
                            });
                            if (rdata.status) {
                                layer.close(i);
                                window.location.reload()
                            }
                        })
                    })
                } else {
                    layer.msg(rdata.msg, {
                        icon: 1
                    });
                }
            })
        }
    }

    aliyundrive_uploader.get_index();

    /**
     * 发送get请求
     * 注意：除非你知道如何自己构造正确访问插件的ajax，否则建议您使用此方法与后端进行通信
     * @param url    插件名称 如：demo
     * @param args           传到插件方法中的参数 请传入数组，示例：{p:1,rows:10,callback:"demo.get_logs"}
     * @param callback       请传入处理函数，响应内容将传入到第一个参数中
     */
    function request_get(url, args, callback, timeout) {
        if (!timeout) timeout = 3600;
        $.ajax({
            type: 'GET',
            url: url,
            data: args,
            timeout: timeout,
            dataType: 'json',
            success: function (rdata) {
                if (!callback) {
                    layer.msg(rdata.msg, {
                        icon: rdata.status ? 1 : 2
                    });
                    return;
                }
                return callback(rdata);
            },
            error: function (ex) {
                if (!callback) {
                    layer.msg('请求过程发现错误!', {
                        icon: 2
                    });
                    return;
                }
                return callback(ex);
            }
        });
    }

    /**
     * 发送post请求
     * 注意：除非你知道如何自己构造正确访问插件的ajax，否则建议您使用此方法与后端进行通信
     * @param url    插件名称 如：demo
     * @param args           传到插件方法中的参数 请传入数组，示例：{p:1,rows:10,callback:"demo.get_logs"}
     * @param callback       请传入处理函数，响应内容将传入到第一个参数中
     */
    function request_post(url, args, callback, timeout) {
        if (!timeout) timeout = 3600;
        $.ajax({
            type: 'POST',
            url: url,
            data: args,
            timeout: timeout,
            dataType: 'json',
            success: function (rdata) {
                if (!callback) {
                    layer.msg(rdata.msg, {
                        icon: rdata.status ? 1 : 2
                    });
                    return;
                }
                return callback(rdata);
            },
            error: function (ex) {
                if (!callback) {
                    layer.msg('请求过程发现错误!', {
                        icon: 2
                    });
                    return;
                }
                return callback(ex);
            }
        });
    }

    /**
     * 发送请求到插件
     * 注意：除非你知道如何自己构造正确访问插件的ajax，否则建议您使用此方法与后端进行通信
     * @param plugin_name    插件名称 如：demo
     * @param function_name  要访问的方法名，如：get_logs
     * @param args           传到插件方法中的参数 请传入数组，示例：{p:1,rows:10,callback:"demo.get_logs"}
     * @param callback       请传入处理函数，响应内容将传入到第一个参数中
     */
    function request_plugin(plugin_name, function_name, args, callback, timeout) {
        if (!timeout) timeout = 3600;
        return $.ajax({
            type: 'POST',
            url: '/plugin?action=a&s=' + function_name + '&name=' + plugin_name,
            data: args,
            timeout: timeout,
            dataType: 'json',
            success: function (rdata) {
                if (!callback) {
                    layer.msg(rdata.msg, {
                        icon: rdata.status ? 1 : 2
                    });
                    return;
                }
                return callback(rdata);
            },
            error: function (ex) {
                if (!callback) {
                    layer.msg('请求过程发现错误!', {
                        icon: 2
                    });
                    return;
                }
                return callback(ex);
            }
        });
    }