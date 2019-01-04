class Store {
  constructor () {
    this.session = {}
    this.expire = {}
    this.loginTimes = {}
    const that = this
    setInterval(function () {
      that.intervalDel()
    }, 24 * 60 * 60 * 1000)
  }
  // 去除过期session(每分钟一次)
  intervalDel () {
    const now = new Date().getTime()
    for (const i in this.expire) {
      if (this.expire[i] < now) {
        delete this.expire[i]
        delete this.session[i]
      }
    }
    for (const i in this.loginTimes) {
      if (this.loginTimes[i].expire < now) {
        delete this.loginTimes[i]
      }
    }
  }
  /**
   * 设置session
   * @param {*} id // session唯一标识
   * @param {*} obj  //session对象
   * @param {*} expire  //过期时时间（毫秒）,默认1天
   */
  set (id, obj, expire = 86400000) {
    this.session[id] = obj
    const now = new Date().getTime()
    this.expire[id] = now + expire
  }
  /**
   * 销毁session
   * @param {*} id // session标识
   */
  destroy (id) {
    delete this.expire[id]
    delete this.session[id]
  }
  /**
   * 获取session信息
   * @param {*} id // session标识
   */
  get (id) {
    return this.session[id]
  }
  /**
   * 设置登录次数
   * @param {*} id // session标识
   * @param {*} expire // 过期时间
   */
  setLoginTimes (id, expire) {
    const now = new Date().getTime()
    if (this.loginTimes[id]) {
      this.loginTimes[id].times++
      this.loginTimes[id].expire = now + expire
    } else {
      this.loginTimes[id] = { times: 1, expire: now + expire }
    }
  }
  /**
   * 解除锁定
   * @param {*} name
   * @param {*} time
   */
  unlockUser (name, time) {
    setTimeout(() => {
      delete this.loginTimes[name]
    }, time * 1000)
  }
  /**
   * 获取登录次数信息
   * @param {*} id session标识
   */
  getLoginTimes (id) {
    return this.loginTimes[id]
  }
  /**
   * 清除登录次数
   * @param {*} id session标识
   */
  clearLoginTime (id) {
    delete this.loginTimes[id]
  }
}

module.exports = new Store()
