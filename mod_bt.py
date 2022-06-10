import re,shutil
template_path='/www/server/panel/BTPanel/'
replace_=dict()
### 首页替换掉广告
### 首页状态 、 概览合并成一行，针对多个硬盘的不适合，因为超过了4个圈圈
replace_['templates/default/index.html']={
        r"\{%\ if\ data\['pd'\]\.find\('免费版'\)\ !=\ -1\ %\}[\s\S]*\{%\ endif %\}":'',
        '<div class="col-xs-24 col-sm-24 col-md-24" id="home-recommend"></div>':'',
        'col-xs-4 col-sm-4 col-md-4 col-lg-3':'col-xs-6 col-sm-3 col-md-3 col-lg-3',
        'col-xs-6 col-sm-3 col-md-3 col-lg-2 mtb20':'col-xs-6 col-sm-3 col-md-3 col-lg-3 mtb20',
        'server bgw mtb15 radius4':"col-xs-12 col-sm-12 col-md-12 bgw mtb15 radius4 container-fluid\">\n\
            <div class=\"server col-xs-6",
        'system-info clearfix bgw mtb15 radius4':'system-info col-xs-6',
        '<div class="col-xs-12 col-sm-12 col-md-6 pull-left pd0">\n            <div class="pr8">':'</div>\n        <div class="col-xs-12 col-sm-12 col-md-6 pull-left pd0">\n            <div class= \'pr8\'>',
        ## 增加调用测试网站是否正常
        '检测中</span></a></div>\n\
                        </li>\n\
                    </ul>\n\
                </div>':'检测中</span></a></div>\n\
                        </li>\n\
                    </ul>\n\
                </div>\n\
                <div id="urls" class="c6 f16 plr15">\n\
                </div>'
        '\"\{\{data\[\'bind\'\]\}\}\"':'"{{data[\'bind\']}}"\n\
    var rdatas={{data[\'urls\'] | safe }};\
    rdatas.map(function (item) {\
          $("#urls").append("<button id=\'"+item[\'id\']+"\'  class=\'btn btn-xs btn-default col-xs-4 col-sm-3 col-md-2 col-lg-2\' style=\'margin:10px\'>"+item[\'id\']+"</button>");\
    });',
    '\<script type="text/javascript" src="\{\{g.cdn_url\}\}/js/echarts.min.js':'<script type="text/javascript" src="{{g.cdn_url}}/js/d3.v3.min.js" ></script>\n\
    <script type="text/javascript" src="{{g.cdn_url}}/js/echarts.min.js'
}

### 首页概览框框站位太大，改小一点
replace_['static/css/site.css']={
    'max-width: 230px;':'max-width: 100px;'
    }

### 首页增加测试按钮，需要配置测试内容，后期再修改
### 并将softboxcon广告栏删除
replace_['static/js/index.js']={
    "\$\(\"#indexsoft\"\).append\(softboxcon\);":'',
    "index.get_init\(\)":"function numcolor(num) {\n\
    var colorLinear = d3.scale.linear().domain([-1,0,1, 120, 10000]).range([\"#555555\",\"#eeeeee\", \"#30ca30\", \"#EEE685\", \"#EE3B3B\"]);\n\
    return colorLinear(num);\n\
}\n\
function test_service(){\n\
        let rdatas=[{'id':'DEV','url':  'https://dev.name.ouyanghome.com/api/','val_str':'home'}];\n\
        rdatas.map(function(rdata){\n\
          $.post({\n\
                url:'validation', \n\
                data: {'u':rdata['url'],'v':rdata['val_str'],'m':rdata['method']},\n\
                success:function (data) {\n\
                target=$('#'+rdata['id']);\n\
                target.css('background-color',numcolor(data));\n\
              }\n\
            }\n\
          )\n\
        })\n\
test_service();t=setInterval(test_service, 60*1000);\n\
index.get_init()",
    }
## 首页增加一个接口，验证网站是否正常，
replace_['__init__.py']={
    "return render_template\('index.html', data=data\)":"data['urls'] = json.load('/www/server/urls.json')\n\
    return render_template('index.html', data=data)\n\
import requests\n\
@app.route('/validation',methods=method_all)\n\
def httpPost():\n\
    url=request.form.get('u')\n\
    val_str=request.form.get('v')\n\
    method=request.form.get('m')\n\
    try:\n\
        if method.lower()=='post':\n\
            data=requests.post(url,data=data,timeout = 10,headers = {})\n\
        else:\n\
            data=requests.get(url,timeout = 10,headers = {})\n\
        if val_str in  data.text:\n\
            return str(data.elapsed.microseconds//1000)\n\
        else:\n\
            return '-1'\n\
    except:\n\
        return '0'\n\
    return '-1'\n\
"
}

###软件菜单默认进入已安装，
### 如果收费软件则屏蔽掉
### 有bug默认不处理
replace_['static/js/soft.js']={
    # "type == 'undefined'\) type = 0;":"type == 'undefined') type = -1;",
    # "page, type, search, function (rdata) {":"page, type, search, function (rdata) {\n\
    # ndata=[];rdata.list.data.map( item => { if ( item.price ==0 ) ndata.push(item);});rdata.list.data=ndata;\n"
    }
###定时任务很多，400px摆不下，加长
replace_['static/js/crontab.js']={
    "maxHeight: height < 400 \? '400px'":"maxHeight: height < 1000 ? '1000px'",
    }
###面板日报未购买，那就删除吧
replace_['templates/default/control.html']={
    '<div class="tabs-item" data-name="daily">面板日报</div>':'',
    }
###删除页脚，也可替换称自己的内容
replace_['templates/default/layout.html']={
    '<div class="footer bgw">[\s\S]*</div>\n    </div>':'  </div>',
    }
###删除软件上方广告付费栏
replace_['templates/default/soft.html']={
    '<div id="updata_pro_info">':'',
    }
###将文件管理中的数据同步改为上传到阿里云盘，配合阿里云盘工具实现
###将数据同步工具设为已经购买isbuy=1
### 对文件夹和文件都生效
### 替换rsync执行命令alidrive.add_task(data.path);
replace_['static/js/files.js']={##目录直接上传阿里云
    "thomConfig.list, function \(index, item\) {":"thomConfig.list, function (index, item) {\n          item['isBuy']=1",
    "if \(data.type !== 'dir'\) delete config\['rsync'\];":'',
    "case\ 'rsync'[\s\S]*case\ 'authority'":"case 'rsync'\n        alidrive.add_task(data.path);\n        break;\n      case 'authority'",
    }
### 增加阿里云js，并拷贝到相应的目录，并将上方rsync菜单隐藏
replace_['../plugin/mfboot/files.html']={
    ##要么直接隐藏数据同步按钮，
    ##或者增加onclick="bt.soft.set_lib_config('alidrive','阿里云盘上传工具')"
    # 'nav_btn file_rsync_list':'nav_btn file_rsync_list hide',
    'nav_btn file_rsync_list':'nav_btn file_upload" onclick="bt.soft.set_lib_config(\'alidrive\',\'阿里云盘上传工具\')',
    '\{\{ super\(\) \}\} ':'{{ super() }}\n    <script type="text/javascript" src="{{g.cdn_url}}/js/aliyun.js" defer></script>'
    }

## ###调用软件限制，收费软件不能启动，通过屏蔽实现调用
# replace_['../class/panelPlugin.py']={ ## 调用软件限制
#     'return public.get_error_object\(None,plugin_name=get.name\)':"p=dict()\n\
#             p['name']='haha'\n\
#             p['type']='1'\n\
#             p['endtime']='-1'\n\
#             return p",
#     }

###删除在线客服，将debugs及后面的几行删除
replace_['static/js/public.js']={  
    "body.append\(\$.*":"",
    }

###删除mf自启动相关内容
replace_['../plugin/mfboot/index.html']={
    '<p onclick="mfboot.show_me\(\)">联系方式</p>':'',
    }



##class/panelPlugin.py
    # def writelog(self,words):
    #     f=open('/www/work/plugin_log.txt','a')
    #     f.write(words+'\n')
    #     f.close()
    # #取软件列表，并删除收费软件
    # def get_soft_list(self,get = None):
    #     softList = self.get_cloud_list(get)
    #     if not softList:
    #         get.force = 1
    #         softList = self.get_cloud_list(get)
    #         if not softList: return public.returnMsg(False,'软件列表获取失败(401)!')
    #     # self.writelog(str(softList))
    #     blist=[]
    #     for n in softList['list']:
    #         if n['price']==0:blist.append(n)
    #     softList['list']=blist



## 开始替换
for i in replace_.keys():
    f=open(template_path+i,mode='r',encoding='utf-8').read()
    for rep in replace_[i].keys():
        print(rep)
        f=re.sub(rep,replace_[i][rep],f)
    w=open(template_path+i,mode='w',encoding='utf-8')
    w.write(f)
    w.close()

shutil.copy('./aliyun.js','/www/server/panel/BTPanel/static/js/')
shutil.copy('./d3.v3.min.js','/www/server/panel/BTPanel/static/js/')
shutil.copy('./urls.json','/www/server/')
os.system('/www/server/panel/pyenv/bin/pip3 install aligo')
##阿里云盘依赖
# print(f)