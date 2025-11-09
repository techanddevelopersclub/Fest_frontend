import { useGetAllEventsQuery } from "../../../../state/redux/events/eventsApi";
import FixedBackdrop from "../../../../components/FixedBackdrop/FixedBackdrop";

const Home = () => {
  // Fetch events for the home page
  const { data: { events = [] } = {}, isLoading, error } = useGetAllEventsQuery(`
    {
      events [{
        _id,
        name,
        image,
        summary,
        type,
        category,
        startTime,
        endTime,
        imageBlurHash
      }]
    }
  `);

  return (
    <div>
      <FixedBackdrop />
      
      {/* Banner section - can be added when Banner component is available */}
      {/* <div className="mb-8">
        <Banner />
      </div> */}

      {/* About section - can be added when AboutFea component is available */}
      {/* <div data-aos="fade-right">
        <AboutFea />
      </div> */}
      
      {/* Events section - Display events if available */}
      {events && events.length > 0 && (
        <div className="p-4">
          <h2 className="text-2xl font-bold mb-4">Upcoming Events</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {events.slice(0, 6).map((event) => (
              <div key={event._id} className="border rounded-lg p-4">
                {event.image && (
                  <img 
                    src={event.image} 
                    alt={event.name} 
                    className="w-full h-48 object-cover rounded mb-2"
                  />
                )}
                <h3 className="font-semibold text-lg">{event.name}</h3>
                {event.summary && (
                  <p className="text-gray-600 text-sm mt-2">{event.summary}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {isLoading && (
        <div className="p-4">
          <p>Loading events...</p>
        </div>
      )}

      {error && (
        <div className="p-4">
          <p>Error loading events. Please try again later.</p>
        </div>
      )}

      {/* Schedule section - can be added when Schedule component is available */}
      {/* <div className="mt-32">
        <Schedule />
      </div> */}
    </div>
  );
};

export default Home;
