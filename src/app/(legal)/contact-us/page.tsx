
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact Us",
};

const ContactUsPage = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-4">Contact Us</h1>
      <p>
        If you have any questions or concerns, please feel free to contact us.
      </p>
      <p>
        Email: 226mayankkle@gmail.com
      </p>
    </div>
  );
};

export default ContactUsPage;
