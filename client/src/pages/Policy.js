import React from "react";
import Layout from "./../components/Layout";

const Policy = () => {
  return (
    <Layout title={"Privacy Policy"}>
      <div className="row contactus ">
        <div className="col-md-6 ">
          <img
            src="/images/contactus.jpeg"
            alt="contactus"
            style={{ width: "100%" }}
          />
        </div>
        <div className="col-md-4">
          <h1 className="bg-dark p-2 text-white text-center">PRIVACY POLICY</h1>
          <div className="mt-3">
            <h5>Information Collection</h5>
            <ul>
              <li>We collect personal information such as name, email, phone number, and shipping address when you register or place an order.</li>
              <li>Payment information is processed securely through our payment gateway and is not stored on our servers.</li>
            </ul>

            <h5 className="mt-3">Use of Information</h5>
            <ul>
              <li>Your information is used to process orders, deliver products, and communicate order updates.</li>
              <li>We may send promotional emails about new products and special offers. You can opt-out at any time.</li>
            </ul>

            <h5 className="mt-3">Data Protection</h5>
            <ul>
              <li>We implement security measures to protect your personal information from unauthorized access.</li>
              <li>Your data is stored on secure servers with encryption protocols.</li>
            </ul>

            <h5 className="mt-3">Cookies</h5>
            <ul>
              <li>We use cookies to enhance your shopping experience and remember your preferences.</li>
              <li>You can disable cookies in your browser settings, but this may affect site functionality.</li>
            </ul>

            <h5 className="mt-3">Third-Party Disclosure</h5>
            <ul>
              <li>We do not sell, trade, or transfer your personal information to third parties without your consent.</li>
              <li>Trusted partners who assist in operating our website may have access to your information under strict confidentiality agreements.</li>
            </ul>

            <h5 className="mt-3">Your Rights</h5>
            <ul>
              <li>You have the right to request access to, correction, or deletion of your personal data.</li>
              <li>Contact us at www.help@ecommerceapp.com for any privacy-related concerns.</li>
            </ul>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Policy;