import Navbar from "../../components/Navbar/Navbar";
import FixedBackdrop from "../../../../components/FixedBackdrop/FixedBackdrop";

const Home = () => {
const data = useLoaderData();
  const events = data.events;
  return (
    <div>
      <div className="mb-8">
        <Banner />
      </div>

      <div data-aos="fade-right">
        <AboutFea />
      </div>
      
      <Events events={events} />

      <div className="mt-32">
        <Schedule />
      </div>
    </div>
  );
};

export default Home;
