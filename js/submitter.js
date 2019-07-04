window.onload = function () {
    var form = layui.form,
        t1 = null,//获取北京的定时器
        t3 = null,//提交的定时器;
        span = null,
        temp = null,
        self = null,
        date = null,
        now = null;
    Date.prototype.toString = function () {
        return this.getFullYear()
            + "-" + (this.getMonth() > 8 ? (this.getMonth() + 1) : "0" + (this.getMonth() + 1))
            + "-" + (this.getDate() > 9 ? this.getDate() : "0" + this.getDate())
            + " " + (this.getHours() > 9 ? this.getHours() : "0" + this.getHours())
            + ":" + (this.getMinutes() > 9 ? this.getMinutes() : "0" + this.getMinutes())
            + ":" + (this.getSeconds() > 9 ? this.getSeconds() : "0" + this.getSeconds())
            + ":" + (this.getMilliseconds() > 100 ? this.getMilliseconds() : this.getMilliseconds() > 10 ? "0" + this.getMilliseconds() : "00" + this.getMilliseconds());
    };
    new Vue({
        el: '.layui-layout',
        data: {
            now: {//当前北京时间
                string: '1999-01-01 00:00:00:000',
                timestamp: 0,//时间戳
                year: null,
                month: null,
                day: null,
                hour: null,
                minutes: null,
                second: null,
                millisecond: null
            },
            post_span: '500',//提交间隔
            post_url: 'https://quan.suning.com/getSysTime.do',//提交地址
            post_url_temp: null,//缓存提交地址
            post_count: 0,//提交数次
            post_window_count: 1,//提交窗口
            post_mode:1,//提交模式
            is_post: false,//是否正在提交
            post_res:"",//请求返回信息
            post_window_arr: [],
            has_post_count: 0,//提交次数
            first_commit_time:"",
            count_down: {  //倒计时
                string: '1999-01-01 00:00:00',
                day: 0,
                hour: 0,
                minutes: 0,
                second: 0,
                millisecond: 0
            },
            post_time: {//提交定时
                year: 0,
                month: 0,
                day: 0,
                hour: 0,
                minutes: 0,
                second: 0,
                millisecond: 0,
                temp: 0
            },
            is_post_trigger:false
        },
        methods: {
            getTime: function () {//获取北京时间
                fetch('https://api.m.jd.com/client.action?functionId=babelActivityGetShareInfo&client=wh5').then(function (res) {
                    return res.json();
                }).then(function (value) {
                    date = new Date(+value.time);
                    self.now.timestamp = +value.time;
                    self.now.year = date.getFullYear();
                    self.now.month = date.getMonth() + 1;
                    self.now.day = date.getDate();
                    self.now.hour = date.getHours();
                    self.now.minutes = date.getMinutes();
                    self.now.second = date.getSeconds();
                    self.now.millisecond = date.getMilliseconds();
                    self.now.string = date.toString();
                })
            },
            timer: function () {//获取北京时间的定时器
                t1 = setInterval(function () {
                    self.getTime();
                    if(self.is_post && !self.is_post_trigger){
                        self.countDown();
                    }
                }, 500)
            },
            setTime: function () {//初始化表单年月日默认值
                now = new Date();
                this.post_time.year = now.getFullYear();
                this.post_time.month = now.getMonth() + 1;
                this.post_time.day = now.getDate();
                this.post_time.hour = now.getHours();
            },
            post: function () {
                this.post_window_arr.length = this.post_window_count;
                this.post_url_temp = this.post_url;
                this.count_down.string = String(this.post_time.year) + "/" + String(this.post_time.month) + "/" + String(this.post_time.day) + " " + String(this.post_time.hour) + ":" + String(this.post_time.minutes) + ":" + String(this.post_time.second);  //拼接时间戳字符
                this.count_down.string = new Date(this.count_down.string).getTime() + Number(this.post_time.millisecond);
                this.is_post = true;
                if(self.post_mode !== 1){
                    self.getCommit();
                }
            },
            cancel: function () {
                this.stop();
                this.first_commit_time = "";
                this.is_post = false;
                this.post_url = this.post_url_temp;
                this.has_post_count = 0;
                this.is_post_trigger = false;
            },
            countDown: function () {//倒计时
                span = self.count_down.string - self.now.timestamp;
                self.count_down.day = Math.floor(span / 1000 / 60 / 60 / 24);
                self.count_down.hour = Math.floor(span / 1000 / 60 / 60 % 24);
                self.count_down.minutes = Math.floor(span / 1000 / 60 % 60);
                self.count_down.second = Math.floor(span / 1000 % 60);
                temp = "" + span;
                self.count_down.millisecond = span > 1000 ? "" + temp.substr(temp.length - 3, temp.length) : temp;
                if (span <= 0) {
                    self.commit();
                    self.count_down.day = 0;
                    self.count_down.hour = 0;
                    self.count_down.minutes = 0;
                    self.count_down.second = 0;
                    self.count_down.millisecond = 0;
                    self.first_commit_time = self.now.string;
                    self.is_post_trigger = true;
                }
            },
            commit: function () {//提交
                t3 = setInterval(function () {
                    //次数
                    self.has_post_count += Number(self.post_window_count);
                    if(self.post_mode == 1){
                        self.frameCommit();
                    }else{
                        self.getCommit();
                    }
                    if (self.has_post_count >= self.post_count && Number(self.post_count) !== 0) {
                        self.stop();
                    }
                }, self.post_span);
            },
            frameCommit:function(){
                //刷新提交地址
                if (self.post_url.indexOf('?') > -1) {
                    self.post_url = self.post_url_temp + "&t=" + self.has_post_count;
                } else {
                    self.post_url = self.post_url_temp + "?t=" + self.has_post_count;
                }
            },
            getCommit:function(){
                fetch(self.post_url).then(function (res) {
                    return res.json();
                }).then(function (value) {
                    self.post_res = value;
                })
            },
            stop: function () {//停止提交
                if (t3) {
                    window.clearInterval(t3);
                    t3 = null;
                }
            }
        },
        mounted: function () {
            self = this;
            this.timer();
            this.setTime();
            form.on('submit(post)', function () {
                if (!self.is_post) {
                    self.post();
                } else {
                    self.cancel();
                }
            });
        }
    })
}
