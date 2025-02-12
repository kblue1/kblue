const Base = require('./base.js');
const rp = require('request-promise');

module.exports = class extends Base {
  async loginByWeixinAction() {
    const code = this.post('code');
    const fullUserInfo = this.post('userInfo');
    const userInfo = fullUserInfo.userInfo;
    const clientIp = ''; // 暂时不记录 ip

    // 获取openid
    const options = {
      method: 'GET',
      url: 'https://api.weixin.qq.com/sns/jscode2session',
      qs: {
        grant_type: 'authorization_code',
        js_code: code,
        secret: think.config('weixin.secret'),
        appid: think.config('weixin.appid')
      }
    };

    let sessionData = await rp(options);
    sessionData = JSON.parse(sessionData);
    if (!sessionData.openid) {
      return this.fail('登录失败');
    }

    // 验证用户信息完整性
    const crypto = require('crypto');
    const sha1 = crypto.createHash('sha1').update(fullUserInfo.rawData + sessionData.session_key).digest('hex');
    if (fullUserInfo.signature !== sha1) {
      return this.fail('登录失败');
    }

    // 解释用户数据
    const WeixinSerivce = this.service('weixin', 'api');
    const weixinUserInfo = await WeixinSerivce.decryptUserInfoData(sessionData.session_key, fullUserInfo.encryptedData, fullUserInfo.iv);
    if (think.isEmpty(weixinUserInfo)) {
      return this.fail('登录失败');
    }

    // 根据openid查找用户是否已经注册
    let userId = await this.model('user').where({ weixin_openid: sessionData.openid }).getField('id', true);
    if (think.isEmpty(userId)) {
      // 注册
      userId = await this.model('user').add({
        username: '微信用户' + think.uuid(6),
        password: sessionData.openid,
        register_time: parseInt(new Date().getTime() / 1000),
        register_ip: clientIp,
        last_login_time: parseInt(new Date().getTime() / 1000),
        last_login_ip: clientIp,
        mobile: '',
        weixin_openid: sessionData.openid,
        avatar: userInfo.avatarUrl || '',
        gender: userInfo.gender || 1, // 性别 0：未知、1：男、2：女
        nickname: userInfo.nickName
      });
    }

    sessionData.user_id = userId;

    // 查询用户信息
    const newUserInfo = await this.model('user').field(['id', 'nickname', 'gender', 'avatar', 'apply','user_no','period']).where({ id: userId }).find();

    // 更新登录信息
    userId = await this.model('user').where({ id: userId }).update({
      last_login_time: parseInt(new Date().getTime() / 1000),
      last_login_ip: clientIp
    });
    // if (think.period == undefined){
      const data = await this.model('period').where({ id: 1 }).find();
      think.period = data.period
      think.applyEnable = data.apply_enable
      think.focusEnable = data.focus_enable
      think.viewUserEnable = data.view_user_enable
      think.viewResultEnable = data.view_result_enable
      think.waitting = data.waitting
    // }

    const TokenSerivce = this.service('token', 'api');
    const sessionKey = await TokenSerivce.create(sessionData);

    if (think.isEmpty(newUserInfo) || think.isEmpty(sessionKey)) {
      return this.fail('登录失败');
    }

    let userData = {}
    userData.id = newUserInfo.id
    userData.nickname = newUserInfo.nickname
    userData.gender = newUserInfo.gender
    userData.avatar = newUserInfo.avatar
    userData.userNo = newUserInfo.user_no
    userData.period = newUserInfo.period
    userData.apply = newUserInfo.apply
    let systemData = {}
    systemData.period = this.getPeriodNum()
    systemData.applyEnable = this.getPeriodApplyEnable()
    systemData.viewUserEnable = this.getPeriodViewUserEnable()
    systemData.focusEnable = this.getPeriodFocusEnable()
    systemData.viewResultEnable = this.getPeriodViewResultEnable()
    systemData.waitting = this.getPeriodWaitting()
    return this.success({ token: sessionKey, userInfo: userData ,systemData:systemData});
  }

  async logoutAction() {
    return this.success();
  }
};
