import SingleFaq from "./SingleFaq";

const Faqs = ({ faqs }) => {
  return (
    <div>
      <div className="px-3 py-8 mb-36 max-w-4xl m-auto" data-aos="fade-up">
        <h2 className="text-2xl md:text-3xl font-semibold mb-1 text-fb md:pl-0">FAQS</h2>
        {faqs?.map((faq, i) => (
          <SingleFaq key={i} faq={faq} />
        ))}
      </div>
    </div>
  );
};

export default Faqs;
