import api from "../api";

const pendingParticipantsApi = api.injectEndpoints({
  endpoints: (builder) => ({
    createPendingParticipant: builder.mutation({
      query: (body) => ({
        url: "/pending-participants",
        method: "POST",
        body,
      }),
      invalidatesTags: ["PendingParticipants"],
    }),
    verifyPendingParticipant: builder.mutation({
      query: (id) => ({
        url: `/pending-participants/${id}/verify`,
        method: "POST",
      }),
      invalidatesTags: ["PendingParticipants"],
    }),
    rejectPendingParticipant: builder.mutation({
      query: ({ id, reason }) => ({
        url: `/pending-participants/${id}/reject`,
        method: "POST",
        body: { reason },
      }),
      invalidatesTags: ["PendingParticipants"],
    }),
    listPendingParticipants: builder.query({
      query: (params) => ({
        url: "/pending-participants",
        params,
      }),
      providesTags: ["PendingParticipants"],
    }),
  }),
});

export const {
  useCreatePendingParticipantMutation,
  useVerifyPendingParticipantMutation,
  useRejectPendingParticipantMutation,
  useListPendingParticipantsQuery,
} = pendingParticipantsApi;

export default pendingParticipantsApi;
