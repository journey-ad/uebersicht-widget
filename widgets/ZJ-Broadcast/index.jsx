import { run, css } from 'uebersicht'

/*********************** Start 插件配置 ***********************/
/*********************** 下面是自定义区 ***********************/

const config = {
  theme: {
    opacity: 95, // 插件默认透明度，可以输入 0 到 100 之间的任意数字，100 代表不透明，0 代表完全透明。
    default: 'auto', // 插件默认主题，light 代表浅色，dark 代表深色， auto 跟随系统外观
    light: {
      fontColor: 'rgba(0, 0, 0, 0.85)', // 浅色主题主标题文字颜色
      fontSubColor: 'rgba(0, 0, 0, 0.55)', // 浅色主题副标题文字颜色
      backgroundColor: `rgba(255, 255, 255, 0.85)` // 浅色主题背景颜色及透明度
    },
    dark: {
      fontColor: 'rgba(255, 255, 255, 0.85)', // 深色主题主标题文字颜色
      fontSubColor: 'rgba(255, 255, 255, 0.55)', // 深色主题副标题文字颜色
      backgroundColor: `rgba(0, 0, 0, 0.85)` // 深色主题背景颜色及透明度
    },
  },
  refresh: 1,
  POSITION: {
    x: 'left', // 显示在桌面左边还是右边，left代表左，right代表右
    y: 'top', // 显示在桌面顶部还是底部，top代表顶部，bottom代表底部
    marginX: 370, // 水平边距
    marginY: 220, // 垂直边距
  }
}

/*********************** 上面是自定义区 ***********************/
/*********************** End 插件配置 ***********************/

const uidMap = {
  'A-SOUL': Object.values({
    'A-SOUL_Official': 703007996,
    '向晚大魔王': 672346917,
    '贝拉Kira': 672353429,
    // '珈乐Carol': 351609538,
    '嘉然今天吃什么': 672328094,
    '乃琳Queen': 672342685,
  }),
  '闪耀舞台': Object.values({
    '思诺snow': 3537115310721781,
    '心宜不是心仪': 3537115310721181
  }),
  '枝江羊驼': Object.values({
    '枝江娱乐官方': 3493085336046382,
    'A-SOUL_Official': 703007996,
    '枝江娱乐的小黑': 3493082517474232
  })
}

let curType = Object.keys(uidMap)[0]
let isTypeMenuShow = false

let emoteMap = {}
run(`cat ZJ-Broadcast/emote_map.json`)
  .then((data) => {
    emoteMap = JSON.parse(data)
  })

const parseEmote = (text) => {
  const reg = new RegExp(/[\[【](.*?)[\]】]/g)
  return text.replace(reg, (match, key) => {
    key = `[${key}]`

    if (emoteMap[key]) {
      const url = emoteMap[key]?.replace("http://", "https://");
      return `<img class="${emote}" src="${url}" title="${key}">`
    }

    return match;
  });
};

const fetchUserDynamics = uid => {
  return new Promise((resolve, reject) => {
    run(`curl -sS "https://api.vc.bilibili.com/dynamic_svr/v1/dynamic_svr/space_history?host_uid=${uid}&offset_dynamic_id=0&need_top=0"`)
      .then(response => {
        return JSON.parse(response)
      })
      .catch(error => {
        reject(error)
      })
      .then(data => {
        resolve(data)
      })
  })
}

let now = Date.now() / 1000 | 0

const utils = {
  noreferrer() {
    const hasMeta = document.querySelector('meta[name="referrer"][content="never"]')
    if (hasMeta) return

    const meta = document.createElement('meta')
    meta.name = 'referrer'
    meta.content = 'never'
    document.head.appendChild(meta)
  },
  dateFmt(ts, format) {
    let dateObj = new Date(ts * 1000);
    let date = {
      "M+": dateObj.getMonth() + 1,
      "d+": dateObj.getDate(),
      "h+": dateObj.getHours(),
      "m+": dateObj.getMinutes(),
      "s+": dateObj.getSeconds(),
      "q+": Math.floor((dateObj.getMonth() + 3) / 3),
      "S+": dateObj.getMilliseconds()
    };
    if (/(y+)/i.test(format)) {
      format = format.replace(RegExp.$1, (dateObj.getFullYear() + '').substr(4 - RegExp.$1.length));
    }
    for (let k in date) {
      if (new RegExp("(" + k + ")").test(format)) {
        format = format.replace(RegExp.$1, RegExp.$1.length == 1 ?
          date[k] : ("00" + date[k]).substr(("" + date[k]).length));
      }
    }
    return format;
  },
  notification({ type, title, message, url, icon }) {
    let app = null

    switch (type) {
      case 'A-SOUL':
        app = 'A-SOUL.app'
        break

      case '闪耀舞台':
      case '枝江羊驼':
      default:
        app = '枝江娱乐.app'
        break
    }

    run(`open -a ${app} --args -title '${title}' -message '${message}' -contentImage '${icon}' -open '${url}'`)

    // run(`osascript -e 'display notification "${desc}" with title "${title}"'`)
  }
}

let fontColor
let fontSubColor
let backgroundColor

let last_dynamic_id = 0

if (config.theme.default === 'auto') {
  let media = window.matchMedia('(prefers-color-scheme: dark)')
  if (media.matches)
    config.theme.default = 'dark'
  else
    config.theme.default = 'light'
}

switch (config.theme.default) {
  case 'dark':
    fontColor = config.theme.dark.fontColor
    fontSubColor = config.theme.dark.fontSubColor
    backgroundColor = config.theme.dark.backgroundColor
    break
  default:
    fontColor = config.theme.light.fontColor
    fontSubColor = config.theme.light.fontSubColor
    backgroundColor = config.theme.light.backgroundColor
    break
}

export const refreshFrequency = config.refresh * 60 * 1000

export const initialState = {
  loading: true,
  data: null,
  refresh: false
}

export const command = dispatch => {
  utils.noreferrer()
  const reqArr = uidMap[curType].map(uid => fetchUserDynamics(uid))
  Promise.all(reqArr)
    .then(retArr => {
      // console.log(retArr)
      let msgList = []
      retArr.forEach(ret => {
        const { cards } = ret.data
        // const _list = cards.slice(0, 5)

        const list = cards.map(item => {
          const { desc, card: raw, display } = item
          const { dynamic_id_str: dynamic_id, type, timestamp, user_profile } = desc
          const { uid, uname, face } = user_profile.info
          const card = JSON.parse(raw)
          let reserve = display?.add_on_card_info?.[0]

          // 直播预约
          if (reserve && reserve.add_on_card_show_type === 6) {
            const { title, reserve_total: total, livePlanStartTime: timestamp } = reserve.reserve_attach_card
            reserve = { title, total, timestamp }
          } else reserve = null

          return {
            dynamic_id,
            type,
            uid,
            uname,
            face,
            card,
            timestamp,
            reserve,
          }
        })
        msgList = msgList.concat(list)
      })
      msgList = msgList
        // .filter(_ => ![1].includes(_.type))
        .sort((a, b) => b.timestamp - a.timestamp)
      // console.log(msgList)

      // 使用一个只在 主显示器生效的组件 设置的 全局变量 区分主副显示器
      if (window.uniqueInstanceHelper) {
        const type_msg = {
          0: "发布了新动态",
          1: "转发了一条动态",
          2: "发布了新动态",
          4: "发布了新动态",
          8: "发布了新投稿",
          16: "发布了短视频",
          64: "发布了新专栏",
          256: "发布了新音频"
        }
        const msg = msgList[0]
        if (now - msg.timestamp < 60 * 2) {
          const { dynamic_id, card } = msg
          if (dynamic_id !== last_dynamic_id) {
            last_dynamic_id = dynamic_id

            const info = {
              type: curType,
              title: `@${msg.uname} ${type_msg[msg.type]}`,
              message: card.title || card?.item?.content || card?.item?.desc || card?.item?.description,
              url: `https://t.bilibili.com/${dynamic_id}`,
              icon: msg.face
            }

            utils.notification(info)
          }
        }
      }

      return dispatch({
        type: 'FETCH_SUCCEDED',
        data: msgList
      })
    })
    .catch(error => {
      return dispatch({ type: 'FETCH_FAILED', error: error })
    })
}

export const updateState = (event, previousState) => {
  if (event.error) {
    return { ...previousState, warning: `错误: ${event.error}` }
  }

  now = Date.now() / 1000 | 0

  switch (event.type) {
    case 'FETCH_SUCCEDED':
      const { data, loading } = event
      return { ...previousState, loading, data }
    case 'REFRESH':
    case 'HIDE_MORE':
      const { refresh } = event
      return { ...previousState, refresh }
    default:
      return previousState
  }
}

export const render = ({ loading, data, refresh, error }, dispatch) => {
  return error ? (
    <div className={errorWrapper}>
      错误信息: <strong>{String(error)}</strong>
    </div>
  ) : (
    <div
      className={css`
          user-select: none;
        `}
    >
      {loading || !data ? (
        <div className={errorWrapper}>加载中...</div>
      ) : (
        <div className={wrapper}>
          <div className={header}>
            <h3 className={title}>
              {curType} 动态播报
              {
                config.refresh > 1 ? (
                  <span>每 {config.refresh} 分钟刷新</span>
                ) : ''
              }
            </h3>
            <div className={typeSwitch}>
              <div className={['btn-menu', iconMenu].join(' ')} onClick={() => { isTypeMenuShow = !isTypeMenuShow; dispatch({ type: 'REFRESH', refresh: true }) }}></div>
              <div className={['type-menu', isTypeMenuShow ? 'show' : ''].join(' ')}>
                {
                  Object.keys(uidMap).map((key, i) => {
                    return (
                      <div
                        key={i}
                        className="item"
                        onClick={() => {
                          curType = key
                          isTypeMenuShow = false
                          dispatch({ type: 'REFRESH', refresh: true })
                          command(dispatch)
                        }}
                      >
                        {key}
                      </div>
                    )
                  })
                }
              </div>
            </div>
          </div>
          {
            data.length === 0 ? (
              <div className={emptyList}>
                <div className="tips">一条动态都没有，怎么会事呢？</div>
              </div>
            )
              : (
                <div className={list}>
                  {data.map((item, i) => {
                    // console.log(item)
                    const { card, reserve } = item
                    return (
                      <div
                        key={i}
                        className="item"
                        data-id={item.dynamic_id}
                        data-type={item.type}
                      >
                        <span className={css`
                            font-size: 12px;
                            color: ${fontSubColor};
                          `}
                        >
                          {item.pub_time}
                        </span>
                        <a
                          className={avatar}
                          href={`https://space.bilibili.com/${item.uid}`}
                          title={item.uname}
                        >
                          <img src={item.face} />
                        </a>
                        <div className={meta}
                        >
                          <div className={pubTitle}
                          >
                            {
                              (() => {
                                if (item.type === 1) { // 转发动态
                                  if (card.origin) {
                                    const origin = JSON.parse(card.origin)
                                    return (
                                      <div>
                                        <a href={`https://t.bilibili.com/${item.dynamic_id}`}>
                                          <span className={textContent}
                                            dangerouslySetInnerHTML={{ __html: parseEmote(card?.item?.content || card?.item?.description) }}
                                          ></span>
                                          <div className={css`
                                          display: flex;
                                          align-items: center;
                                          margin-top: 4px;
                                          background: ${backgroundColor};
                                          padding: 6px 6px;
                                          border-radius: 6px;
                                        `}>
                                            <img
                                              className={cover_s}
                                              src={
                                                origin.pic || origin.face ||
                                                origin?.user?.face || origin?.user?.head_url ||
                                                origin?.author?.face || origin?.author?.head_url
                                              }
                                            />
                                            <span className={metaOrigin}
                                              dangerouslySetInnerHTML={{
                                                __html: parseEmote(origin.title || origin.content || origin.desc || origin.description ||
                                                  origin?.item?.title || origin?.item?.content || origin?.item?.description)
                                              }}></span>
                                          </div>
                                        </a>
                                      </div>
                                    )
                                  } else {
                                    return (
                                      <div>
                                        <a href={`https://t.bilibili.com/${item.dynamic_id}`}>
                                          {card?.item?.content || card?.item?.description}
                                          <div className={css`
                                          display: flex;
                                          align-items: center;
                                          margin-top: 4px;
                                          background: ${backgroundColor};
                                          padding: 6px 6px;
                                          border-radius: 6px;
                                        `}>
                                            <span className={metaOrigin}>
                                              {card?.item?.tips}
                                            </span>
                                          </div>
                                        </a>
                                      </div>
                                    )
                                  }
                                }
                                else if ([2, 4].includes(item.type)) { // 图文动态
                                  return (
                                    <a className={textContent} href={`https://t.bilibili.com/${item.dynamic_id}`}>
                                      <span dangerouslySetInnerHTML={{ __html: parseEmote(card?.item?.content || card?.item?.description) }}></span>
                                      {card?.item?.pictures ? ' ' + Array(card.item.pictures.length).fill('[图片]').join('') : ''}
                                    </a>
                                  )
                                }
                                else if (item.type === 8) { // 视频投稿
                                  return (
                                    <a className={iconVideo}
                                      href={card.short_link}>
                                      {card.title}
                                    </a>
                                  )
                                }
                                else if (item.type === 64) { // 专栏投稿
                                  return (
                                    <a className={iconArticle}
                                      href={`https://www.bilibili.com/read/cv${card.id}`}>
                                      {card.title}
                                    </a>
                                  )
                                }
                                else { // 其他
                                  return (
                                    <span>
                                      {card.title}
                                    </span>
                                  )
                                }
                              })()
                            }
                          </div>
                          {
                            reserve ? (
                              <div className={reserveBox}>
                                <p className="title">{reserve.title}</p>
                                <p className="meta">
                                  <span className={iconClock}>{utils.dateFmt(reserve.timestamp, 'MM-dd hh:mm')}</span>
                                  <span className="total">{reserve.total}人预约</span>
                                </p>
                              </div>
                            ) : ''
                          }
                          <p className={pubIndex}>
                            <span>
                              {utils.dateFmt(item.timestamp, 'yyyy-MM-dd hh:mm:ss')}
                            </span>
                            <span className="name">- {item.uname}</span>
                          </p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )
          }
        </div>
      )
      }
    </div >
  )
}

export const className = `
  position: absolute;
  ${config.POSITION.x === 'left' || config.POSITION.x === 'right' ? config.POSITION.x : 'left'}:
    ${config.POSITION.marginX}px;
  ${config.POSITION.y === 'top' || config.POSITION.y === 'bottom' ? config.POSITION.y : 'top'}:
    ${config.POSITION.marginY}px;
`

const errorWrapper = css`
  font-family: Montserrat, sans-serif;
  width: 20px;
  background-color: ${backgroundColor};
  padding: 24px;
  border-radius: 10px;
  color: ${fontColor};
`

const wrapper = css`
  font-family: Montserrat, sans-serif;
  width: 330px;
  height: 269px;
  opacity: calc(${config.theme.opacity} / 100);
  background-color: ${backgroundColor};
  padding: 16px 20px 14px 20px;
  border-radius: 10px;
  color: ${fontColor};

@media (prefers-color-scheme: dark) {
  img {
    filter: saturate(95%) brightness(50%);
  }
}
`

const header = css`
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
`

const title = css`
  display: inline-block;
  font-size: 16px;
  margin: 0;
  span {
    font-size: 12px;
    margin-left: 15px;
    font-weight: normal;
    opacity: .5;
  }
`

const typeSwitch = css`
  position: relative;
  display: flex;
  align-items: center;

  .btn-menu {
    cursor: pointer;
  }

  .type-menu {
    position: absolute;
    top: 24px;
    right: 0;
    width: max-content;
    font-size: 12px;
    color: ${fontSubColor};
    background: ${backgroundColor};
    border-radius: 6px;
    z-index: 100;
    opacity: 0;
    visibility: hidden;
    pointer-events: none;
    transition: opacity .2s ease-in-out;

    &.show {
      opacity: 1;
      visibility: visible;
      pointer-events: auto;
    }

    .item {
      padding: 4px 12px;
      cursor: pointer;

        &:hover {
          color: ${fontColor};
          background-color: rgba(46, 40, 31, 0.05);
        }
      }
  }
`

const emptyList = css`
width: 100%;
height: 100%;
background-image: url(https://i0.hdslb.com/bfs/emote/62c63c377ab71b151ca14f36d5de8f22224bff3e.png@130w_130h.jpg);
background-size: 130px;
background-position: center 15%;
background-repeat: no-repeat;

.tips {
  padding-top: 55%;
  text-align: center;
  font-size: 16px;
  color: ${fontColor};
}
`

const list = css`
position: absolute;
overflow-y: auto;
width: 334px;
height: 235px;
padding-right: 4px;

&::-webkit-scrollbar {
  width: 4px
}

&::-webkit-scrollbar-thumb {
  background: #ccc;
  border-radius: 4px
}

.item {
  display: flex;
  justify-content: space-between;
  margin: 12px 0;

  &:hover {
    span.name {
      opacity: .5;
    }
  }

  &.ago{
    opacity: 0.33;
  }
}
`

const avatar = css`
flex: none;
display: block;
width: 48px;
height: 48px;
margin: 0 8px 0 0;
border-radius: 4px;
overflow: hidden;
img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
`

const cover_s = css`
width: 24px;
height: 24px;
margin: 0 2px 0 0;
object-fit: cover;
border-radius: 2px;
`

const meta = css`
display: flex;
flex-direction: column;
justify-content: space-between;
width: 100%;
/* margin-right: auto; */

a {
  color: ${fontColor};
  text-decoration: none;
}
`

const metaOrigin = css`
display: block;
font-size: 10px;
line-height: 1.2;
color: ${fontColor};
margin-left: .2em;
word-break: break-all;
overflow: hidden;
display: -webkit-box;
-webkit-box-orient: vertical;
-webkit-line-clamp: 3;
`

const pubTitle = css`
font-size: 12px;
line-height: 1.3;
margin: 0;

a {
  color: ${fontColor};
  cursor: pointer;
}
`

const textContent = css`
overflow: hidden;
display: -webkit-box;
-webkit-box-orient: vertical;
-webkit-line-clamp: 5;
word-break: break-all;
`

const reserveBox = css`
margin-top: 4px;
padding: 4px 6px;
border-radius: 6px;
background: ${backgroundColor};
font-size: 12px;
line-height: 1.2;
color: ${fontColor};
p {
  margin: 0;
}
.title {
  opacity: .9;
}
.meta {
  margin-top: 4px;
  font-size: 10px;
  color: ${fontSubColor};
  .total {
    margin-left: 4px;
  }
}
`

const pubIndex = css`
display: flex;
justify-content: space-between;
align-items: center;
margin: 0;
margin-top: 4px;
font-size: 12px;
color: ${fontSubColor};

.name {
  font-size: 10px;
  font-style: italic;
  opacity: 0;
  transition: opacity .2s ease-in-out;
}
`

const iconVideo = css`
background-image: url("data:image/svg+xml,%3Csvg class='icon' viewBox='0 0 1024 1024' xmlns='http://www.w3.org/2000/svg' width='20' height='20'%3E%3Cpath d='M266.667 170.667h490.666a138.667 138.667 0 0 1 138.454 130.816l.213 7.85v405.334A138.667 138.667 0 0 1 765.184 853.12l-7.85.213H266.666a138.667 138.667 0 0 1-138.454-130.816l-.213-7.85V309.333A138.667 138.667 0 0 1 258.816 170.88l7.85-.213h490.667-490.666zm490.666 64H266.667a74.667 74.667 0 0 0-74.411 68.522l-.256 6.144v405.334a74.667 74.667 0 0 0 68.523 74.41l6.144.256h490.666a74.667 74.667 0 0 0 74.411-68.565l.256-6.101V309.333a74.667 74.667 0 0 0-68.565-74.41l-6.102-.256zM428.928 408.96a21.333 21.333 0 0 1 25.045-10.923l3.584 1.408 186.966 93.44a21.333 21.333 0 0 1 3.242 36.182l-3.242 2.005-186.966 93.483a21.333 21.333 0 0 1-30.549-15.232l-.341-3.883V418.517a21.333 21.333 0 0 1 2.261-9.557z' fill='%23515151'/%3E%3C/svg%3E");
background-size: 24px 18px;
background-repeat: no-repeat;
background-position: 0 -2px;
padding-left: 22px;
`

const iconArticle = css`
background-image: url("data:image/svg+xml,%3Csvg class='icon' viewBox='0 0 1024 1024' xmlns='http://www.w3.org/2000/svg' width='20' height='20'%3E%3Cpath d='M765.79 870.43H258.21c-47.46 0-86.07-38.61-86.07-86.07V273.61c0-45.71 37.19-82.9 82.9-82.9h510.75c47.46 0 86.07 38.61 86.07 86.07v507.57c0 47.47-38.61 86.08-86.07 86.08zM255.04 245.98c-15.24 0-27.63 12.4-27.63 27.63v510.75c0 16.98 13.82 30.81 30.81 30.81h507.57c16.98 0 30.81-13.82 30.81-30.81V276.78c0-16.98-13.82-30.81-30.81-30.81H255.04z' fill='%23515151'/%3E%3Cpath d='M663.3 452.05H362.02c-15.26 0-27.63-12.37-27.63-27.63s12.37-27.63 27.63-27.63H663.3c15.26 0 27.63 12.37 27.63 27.63s-12.37 27.63-27.63 27.63zM574.71 615.6H362.02c-15.26 0-27.63-12.37-27.63-27.63s12.37-27.63 27.63-27.63h212.69c15.26 0 27.63 12.37 27.63 27.63s-12.37 27.63-27.63 27.63z' fill='%23515151'/%3E%3C/svg%3E");
background-size: 24px 18px;
background-repeat: no-repeat;
background-position: 0 -2px;
padding-left: 22px;
`

const iconMenu = css`
width: 16px;
height: 16px;
background-image: url("data:image/svg+xml,%3Csvg class='icon' viewBox='0 0 1024 1024' xmlns='http://www.w3.org/2000/svg' width='128' height='128'%3E%3Cpath d='M128 768h768v-85.333H128V768zm0-213.333h768v-85.334H128v85.334zM128 256v85.333h768V256H128z' fill='%23515151'/%3E%3C/svg%3E");
background-size: contain;
background-repeat: no-repeat;
`

const iconClock = css`
background-image: url("data:image/svg+xml,%3Csvg class='icon' viewBox='0 0 1024 1024' xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cpath d='M512 16C238 16 16 238 16 512s222 496 496 496 496-222 496-496S786 16 512 16zm0 896c-221 0-400-179-400-400s179-400 400-400 400 179 400 400-179 400-400 400zm123.6-208.8L465.8 579.8c-6.2-4.6-9.8-11.8-9.8-19.4V232c0-13.2 10.8-24 24-24h64c13.2 0 24 10.8 24 24v283.4l133.6 97.2c10.8 7.8 13 22.8 5.2 33.6L669.2 698c-7.8 10.6-22.8 13-33.6 5.2z' fill='%23515151'/%3E%3C/svg%3E");
background-size: 10px 10px;
background-repeat: no-repeat;
background-position: left center;
padding-left: 12px;
`

const emote = css`
display: inline-block;
width: 2em;
height: 2em;
margin: 0 .05em;
`
