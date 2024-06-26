const errorNoticeClass = 'wc-block-components-notice-banner is-error'

export const ErrorMessage = ({ messages = [] }) => {
    return messages.map((message, i) => (
        <div className={errorNoticeClass} key={i}>
            {message}
        </div>
    ))
}
