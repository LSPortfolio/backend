module.exports = {
  welcome: {
      subject: 'Welcome to the showcase!',
      html: `Hello, welcome to the Lambda Showcase Portfolio. We would like to show off our exciting projects to display Lambda Students' creative minds. Recruiters are invited to email students to further discuss their projects and their future goals. We welcome you to our community, and if you have any additional questions, please use https://lambdaschool.com/contact to contact us!`
  },
  resetPassword: {
      subject: 'Change Password',
      html: token => `Click the link \n https://lambdashowcase.com/user/changepw?token=${token} \n to reset your password!`
  },
  pwResetSuccess: {
      subject: 'Lambda Showcase Password Change',
      html: `Your password has been successfully changed!`
  },
  makeLive: {
      subject: 'Project Now Live',
      html: `Congratulations, your project has gone live!`
  },
  makeDraft: {
      subject: 'Draft in Progress',
      html: `Thank you for submitting your project!. Currently your project is a draft, so you can customize the display of the project to your liking. -LambdaShowCase `
  },
  notify_project_like: data => {
      return {
          subject: `${data.user.username} Likes Your Project: ${data.project.name}`,
          html: `Hello ${data.user.username}, ${data.project.name} has just been liked by ${data.user.username}!`
      }
  },
  notify_project_comment: data => {
      return {
          subject: `${data.user.username} Commented on Your Project: ${data.project.name}`,
          html: `Enter the body of this email here...`
      }
  }
}