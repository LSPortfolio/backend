module.exports = {
  welcome: {
    subject: 'Welcome to the showcase!',
		html: 'content of the email goes here...'
  },
  resetPassword: {
    subject: 'Change Password',
    html: token => `<html href="https://lambdashowcase.com/user/changepw?token=${token}"> Click here to reset password! </html>`
  },
  pwResetSuccess: {
    subject: 'Your Password has Changed',
    html: 'Body of the email goes in here.'
  },
  makeLive: {
    subject: 'Project now live',
    html: 'Body of the email goes in here.'
  },
  makeDraft: {
    subject: 'Draft in progress',
    html: 'Progress and body of the email goes in here.'
  },
  notify_project_like: data => {
    return {
      subject: `${data.user.username} Likes Your Project: ${data.project.name}`,
      html: `Enter the body of this email here...`
    }
  },
  notify_project_comment: data => {
    return {
			subject: `${data.user.username} Commented on Your Project: ${data.project.name}`,
			html: `Enter the body of this email here...`
		}
  }
}