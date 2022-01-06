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

const uidList = Object.values({
  'Official': 703007996,
  'Ava': 672346917,
  'Bella': 672353429,
  'Carol': 351609538,
  'Diana': 672328094,
  'Eileen': 672342685,
})

const fetchUserDynamics = uid => {
  return new Promise((resolve, reject) => {
    const proxy = 'http://127.0.0.1:41417/'
    fetch(`${proxy}https://api.vc.bilibili.com/dynamic_svr/v1/dynamic_svr/space_history?host_uid=${uid}&offset_dynamic_id=0&need_top=0`)
      .then(response => {
        return response.json()
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
  const reqArr = uidList.map(uid => fetchUserDynamics(uid))
  Promise.all(reqArr)
    .then(retArr => {
      // console.log(retArr)
      let msgList = []
      retArr.forEach(ret => {
        const { cards } = ret.data
        // const _list = cards.slice(0, 5)

        const list = cards.map(item => {
          const { desc, card: raw } = item
          const { dynamic_id_str: dynamic_id, type, timestamp, user_profile } = desc
          const { uid, uname, face } = user_profile.info
          const card = JSON.parse(raw)

          return {
            dynamic_id,
            type,
            uid,
            uname,
            face,
            card,
            timestamp
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
              title: `@${msg.uname} ${type_msg[msg.type]}`,
              desc: card.title || card?.item?.content || card?.item?.desc || card?.item?.description
            }
            run(`osascript -e 'display notification "${info.desc}" with title "${info.title}"'`)
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
              A-SOUL 动态广播
              {
                config.refresh > 1 ? (
                  <span>每 {config.refresh} 分钟刷新</span>
                ) : ''
              }
            </h3>
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
                    const { card } = item
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
                        <img
                          className={cover}
                          src={item.face}
                        />
                        <div className={meta}
                        >
                          <div className={pubTitle}
                          >
                            {
                              (() => {
                                if (item.type === 1) {
                                  if (card.origin) {
                                    const origin = JSON.parse(card.origin)
                                    return (
                                      <div>
                                        <a className={textContent} href={`https://t.bilibili.com/${item.dynamic_id}`}>
                                          <span>{card?.item?.content || card?.item?.description}</span>
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
                                            <span className={metaOrigin}>
                                              {
                                                origin.title || origin.content || origin.desc || origin.description ||
                                                origin?.item?.title || origin?.item?.content || origin?.item?.description
                                              }
                                            </span>
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
                                else if ([2, 4].includes(item.type)) {
                                  return (
                                    <a className={textContent} href={`https://t.bilibili.com/${item.dynamic_id}`}>
                                      <span>{card?.item?.content || card?.item?.description}</span>
                                      {card?.item?.pictures ? ' ' + Array(card.item.pictures.length).fill('[图片]').join('') : ''}
                                    </a>
                                  )
                                }
                                else if (item.type === 8) {
                                  return (
                                    <a className={iconVideo}
                                      href={card.short_link}>
                                      {card.title}
                                    </a>
                                  )
                                }
                                else if (item.type === 64) {
                                  return (
                                    <a className={iconArticle}
                                      href={`https://www.bilibili.com/read/cv${card.id}`}>
                                      {card.title}
                                    </a>
                                  )
                                }
                                else {
                                  return (
                                    <span>
                                      {card.title}
                                    </span>
                                  )
                                }
                              })()
                            }
                          </div>
                          <p className={pubIndex}
                          >
                            <span
                              className={css`
                                color: ${fontSubColor};
                              `}
                            >
                              {utils.dateFmt(item.timestamp, 'yyyy-MM-dd hh:mm:ss')}
                            </span>
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

  &.ago{
    opacity: 0.33;
  }
}
`

const cover = css`
width: 48px;
height: 48px;
margin: 0 8px 0 0;
object-fit: cover;
border-radius: 4px;
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
}
`

const textContent = css`
overflow: hidden;
display: -webkit-box;
-webkit-box-orient: vertical;
-webkit-line-clamp: 5;
word-break: break-all;
`

const pubIndex = css`
margin: 0;
margin-top: 4px;
font-size: 12px;
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
