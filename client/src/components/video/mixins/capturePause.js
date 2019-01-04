export default {
  data() {
    return {
      isCapPause: false,
      capImg: ''
    }
  },
  methods: {
    async capPause() {
      const src = await this.getCap()
      this.pause()
      if (src) {
        this.capImg = src
        this.isCapPause = true
      }
    },
    getCap() {
      return new Promise(resolve => {
        let src = ''
        let i = 5
        while (i-- && !src) {
          src = this.getCapture()
        }
        resolve(src)
      })
    },
    capResume() {
      this.resume()
      this.isCapPause = false
      this.capImg = ''
    }
  }
}
