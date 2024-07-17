import React from "react";

const WelcomeEmail = () => {
  const { html, errors } = render(
    <mjml>
      <mj-head>
        <mj-font
          name="Roboto"
          href="https://fonts.googleapis.com/css?family=Roboto:300,500"
        ></mj-font>
        <mj-attributes>
          <mj-all font-family="Roboto, Helvetica, sans-serif"></mj-all>
          <mj-text
            font-weight="300"
            font-size="16px"
            color="#616161"
            line-height="24px"
          ></mj-text>
          <mj-section padding="0px"></mj-section>
        </mj-attributes>
      </mj-head>
      <mj-body>
        <mj-section padding="20px 0">
          <mj-column width="100%">
            <mj-text align="left" font-size="10px">
              Message from BlueWave Uptime Service
            </mj-text>
          </mj-column>
        </mj-section>
        <mj-section>
          <mj-column width="100%">
            <mj-text>
              <p>Hello Alex!</p>
              <p>
                Thank you for trying out BlueWave Uptime! We developed it with
                great care to meet our own needs, and we're excited to share it
                with you.
              </p>
              <p>
                BlueWave Uptime is an automated way of checking whether a
                service such as a website or an application is available or not.
              </p>
              <p>We hope you find our service as valuable as we do.</p>
              <p>Thank you.</p>
            </mj-text>
          </mj-column>
          <mj-column width="100%">
            <mj-divider border-width="1px" border-color="#E0E0E0"></mj-divider>
            <mj-text font-size="12px">
              <p>This email was sent by BlueWave Uptime.</p>
            </mj-text>
          </mj-column>
        </mj-section>
      </mj-body>
    </mjml>
  );

  if (errors.length > 0) {
    console.error("MJML Errors:", errors);
    return null; // Handle errors gracefully
  }

  return <div dangerouslySetInnerHTML={{ __html: html }} />;
};

export default WelcomeEmail;
