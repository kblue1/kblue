module.exports = class extends think.Controller {
  async __before() {
    // 根据token值获取用户id
    think.token = this.ctx.header['x-nideshop-token'] || '';
    const tokenSerivce = think.service('token', 'api');
    think.userId = await tokenSerivce.getUserId();

    const publicController = this.config('publicController');
    const publicAction = this.config('publicAction');
    // 如果为非公开，则验证用户是否登录
    const controllerAction = this.ctx.controller + '/' + this.ctx.action;
    if (!publicController.includes(this.ctx.controller) && !publicAction.includes(controllerAction)) {
      if (think.userId <= 0) {
        return this.fail(401, '请先登录');
      }
      else{
      }
    }
  }

  /**
   * 获取时间戳
   * @returns {Number}
   */
  getTime() {
    return parseInt(Date.now() / 1000);
  }

  /**
   * 获取当前登录用户的id
   * @returns {*}
   */
  getLoginUserId() {
    return think.userId;
  }

  /**
   * 获取period
   * @returns {*}
   */
  getPeriodNum() {
    return think.period;
  }

   /**
   * 获取当前期的状态
   * @returns {*}
   */

  getPeriodApplyEnable() {
    return think.applyEnable;
  }
  getPeriodViewUserEnable() {
    return think.viewUserEnable;
  }

  getPeriodFocusEnable() {
    return think.focusEnable;
  }
  getPeriodViewResultEnable() {
    return think.viewResultEnable;
  }
  getPeriodWaitting() {
    return think.waitting;
  }


  setPropertyReverse(objData,objSet,propertyData,propertySet){
    if (objSet[propertySet] != undefined){
      objData[propertyData] = objSet[propertySet]
    }
  }

  setProperty(objData,objSet,propertyData,propertySet){
    if (objData[propertyData] != undefined){
      objSet[propertySet] = objData[propertyData]
    }
  }
};
