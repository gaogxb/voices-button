import Setting from '@/../setting/setting.json'

/**
 * Google Analytics 统计工具
 */
class Analytics {
  private gaId: string | null = null
  private initialized = false

  constructor() {
    // 从配置中获取 GA_ID
    const setting = Setting as any
    this.gaId = setting.GA_ID || null
  }

  /**
   * 初始化 Google Analytics
   */
  init() {
    if (!this.gaId || this.initialized) {
      return
    }

    // 动态加载 Google Analytics 脚本
    const script1 = document.createElement('script')
    script1.async = true
    script1.src = `https://www.googletagmanager.com/gtag/js?id=${this.gaId}`
    document.head.appendChild(script1)

    // 初始化 gtag
    const script2 = document.createElement('script')
    script2.innerHTML = `
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', '${this.gaId}');
    `
    document.head.appendChild(script2)

    this.initialized = true
  }

  /**
   * 发送播放事件到服务器
   * @param voiceName 语音名称
   * @param category 分类名称
   */
  trackPlay(voiceName: string, category?: string) {
    if (!this.gaId || !this.initialized) {
      return
    }

    try {
      // 使用 gtag 发送事件
      if (typeof window !== 'undefined') {
        const gtag = (window as any).gtag
        if (gtag) {
          gtag('event', 'play', {
            event_category: 'Audio',
            event_label: voiceName,
            category: category || 'unknown',
            value: 1
          })
        }
      }
    } catch (error) {
      console.warn('Analytics track error:', error)
    }
  }

  /**
   * 发送页面浏览事件
   * @param pagePath 页面路径
   */
  trackPageView(pagePath: string) {
    if (!this.gaId || !this.initialized) {
      return
    }

    try {
      if (typeof window !== 'undefined') {
        const gtag = (window as any).gtag
        if (gtag) {
          gtag('config', this.gaId, {
            page_path: pagePath
          })
        }
      }
    } catch (error) {
      console.warn('Analytics pageview error:', error)
    }
  }
}

// 导出单例
export const analytics = new Analytics()
