import api from "../api";

const participantsApi = api.injectEndpoints({
  endpoints: (builder) => ({
    createParticipant: builder.mutation({
      query: ({ participant, promoCode }) => ({
        url: "/participants",
        method: "POST",
        body: {
          participant,
          promoCode,
        },
      }),
      invalidatesTags: ["Participants"],
    }),
    getParticipationsBySelf: builder.query({
      query: () => "/participants/me",
      providesTags: ["Participants"],
    }),
    getParticipationsByEventId: builder.query({
      query: (eventId) => `/participants/event/${eventId}`,
      providesTags: ["Participants"],
    }),
    updateParticipantAttendance: builder.mutation({
      query: ({ participantId, attendance }) => ({
        url: `/participants/${participantId}/attendance`,
        method: "PATCH",
        body: { attendance },
      }),
      invalidatesTags: ["Participants"],
    }),
    adminBulkRegisterParticipants: builder.mutation({
      query: ({ basicDetails, eventIds }) => ({
        url: "/participants/admin/bulk",
        method: "POST",
        body: {
          basicDetails,
          eventIds,
        },
      }),
      invalidatesTags: ["Participants"],
    }),
  }),
});

export const {
  useCreateParticipantMutation,
  useGetParticipationsBySelfQuery,
  useGetParticipationsByEventIdQuery,
  useUpdateParticipantAttendanceMutation,
  useAdminBulkRegisterParticipantsMutation,
} = participantsApi;
