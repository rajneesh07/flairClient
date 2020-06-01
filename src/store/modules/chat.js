import { CHAT_STATES } from "@/defines";
// import { Logger } from "log4javascript";
function initialState() {
  return {
    showChatSidebar: false,
    chatSessions: [
      // {
      //     state: CHAT_STATES.ACTIVE,
      //     show: false,
      //     chatId: "1234",
      //     participant: {
      //         initials: "SR",
      //         firstName: "Suraj",
      //         lastName: "Raval"
      //     },
      //     messageList: [
      //         {
      //             chatId: "1234",
      //             type: "text",
      //             self: false,
      //             isInteractive: false,
      //             content: {
      //                 text: "Hi, Welcome to AGC's Assistant. You can type your query, or click on one of the following to get started"
      //             }
      //         }
      //     ]
      // },
      // {
      //     state: CHAT_STATES.ACTIVE,
      //     show: false,
      //     chatId: "4567",
      //     participant: {
      //         initials: "RP",
      //         firstName: "Rajneesh",
      //         lastName: "Patel"
      //     },
      //     messageList: [
      //         {
      //             chatId: "4567",
      //             type: "text",
      //             self: false,
      //             isInteractive: false,
      //             content: {
      //                 text: "Hi, Welcome to AGC's Assistant. You can type your query, or click on one of the following to get started"
      //             }
      //         }
      //     ]
      // },
    ],
    chatIds: [],
  };
}

export default {
  namespaced: false,

  state: initialState,

  mutations: {
    SET_CHAT_SIDEBAR(state, showChatSideBarFlag) {
      state.showChatSidebar = showChatSideBarFlag;
    },
    RESET_CHAT_MODULE(state) {
      Object.assign(state, initialState());
    },

    ADD_CHAT_SESSION(state, chat) {
      console.log(chat);
      //check if chat ID exists in the state. If it does not exist, only then add the new chat
      if (chat.chatId && state.chatIds.indexOf(chat.chatId) < 0) {
        let newChat = chat;
        newChat.show = false;
        newChat.state = CHAT_STATES.REQUESTED;
        newChat.messageList = [];
        newChat.isTyping = false;
        newChat.participant.initials =
          chat.participant.firstName.substring(0, 1) + chat.participant.lastName.substring(0, 1);
        state.chatSessions.push(newChat);
        state.chatIds.push(newChat.chatId);
      } else {
        //since chat ID already exists, cannot add the same chat twice
        console.error("chat ID already exists as a session");
      }
    },

    REMOVE_CHAT_SESSION(state, chatId) {
      const index = state.chatIds.indexOf(chatId);
      if (index > -1) {
        state.chatSessions.splice(index, 1);
        state.chatIds.splice(index,1);
      } else {
        console.log("no chat session found for id=" + chatId);
      }
    },
    ADD_MESSAGE_TO_MESSAGE_LIST(state, newMessage) {
      //find the position of the chat in the chatArray
      const chatIndex = state.chatIds.indexOf(newMessage.chatId);

      //add an index field to add an ID to every message of the chat
      newMessage.index = state.chatSessions[chatIndex].messageList.length;

      //add the new message to the message list for the session
      state.chatSessions[chatIndex].messageList.push(newMessage);
    },
    TOGGLE_CHAT_WINDOW(state, index) {
      state.chatSessions[index].show = !state.chatSessions[index].show;
    },
    SET_CHAT_STATE_ENDED(state, chatId) {
      const index = state.chatIds.indexOf(chatId);
      state.chatSessions[index].state = CHAT_STATES.ENDED;
    },

    SET_CHAT_STATE_ACTIVE(state, chatId) {
      const index = state.chatIds.indexOf(chatId);
      state.chatSessions[index].state = CHAT_STATES.ACTIVE;
    },
    SET_CHAT_STATE_CLOSED(state, chatId) {
      const index = state.chatIds.indexOf(chatId);
      state.chatSessions[index].state = CHAT_STATES.CLOSED;
    },
    SET_CHAT_IS_TYPING(state, chatId) {
      const index = state.chatIds.indexOf(chatId);
      state.chatSessions[index].isTyping = true;
    },
    RESET_CHAT_IS_TYPING(state, chatId) {
      const index = state.chatIds.indexOf(chatId);
      state.chatSessions[index].isTyping = false;
    },
  },
  actions: {
    async rejoinChatRooms({ getters }) {
      const currentSessions = getters.getChatSessions;
      for (let session of currentSessions) {
        console.log("session for this chat is==========" + JSON.stringify(session));
        await this._vm.$socket.emit("UPDATE_CHAT_ROOM_ID", { chatroom: session.chatId }, (response) => {
          console.log(response);
        });
      }
    },
    setChatSidebarState({ commit }, showChatSideBarFlag) {
      commit("SET_CHAT_SIDEBAR", showChatSideBarFlag);
    },
    toggleChatWindow({ getters, commit }, chatId) {
      let chatIndex = getters.getChatIndexById(chatId);
      if (chatIndex > -1) {
        commit("TOGGLE_CHAT_WINDOW", chatIndex);
      } else {
        console.log("chatId " + chatId + " not found in chats. chatIndex=" + chatIndex);
      }
    },

    addChatSession({ commit }, chat) {
      commit("ADD_CHAT_SESSION", chat);
    },
    removeChatSession({ commit }, chatId) {
      commit("REMOVE_CHAT_SESSION", chatId);
    },
    addLocalMessage({ commit, dispatch }, newMessage) {
      commit("ADD_MESSAGE_TO_MESSAGE_LIST", newMessage);
      console.log("newMessage=" + JSON.stringify(newMessage));
      dispatch("emitNewMessageRequest", newMessage);
    },
    addBotMessage({ commit, getters }, newMessage) {
      const botResponse = getters.getMessageResponses.filter(
        (item) => item.query.toLowerCase() === newMessage.content.text.toLowerCase()
      );
      console.log("botResponse=" + JSON.stringify(botResponse));
      if (botResponse && botResponse.length > 0) {
        commit("ADD_MESSAGE_TO_MESSAGE_LIST", botResponse[0].response);
      }
    },
    addNewRemoteChatMessage({ commit }, payload) {
      const content = payload.message;
      content.self = false;
      commit("ADD_MESSAGE_TO_MESSAGE_LIST", content);
    },

    emitNewMessageRequest({ }, payload) {
      const request = {
        message: payload,
        chatroom: payload.chatId,
      };
      this._vm.$socket.emit("NEW_CHAT_MESSAGE", request, (response) => {
        console.log(response);
      });
    },
    acceptChatRequest({ commit }, chatId) {
      this._vm.$socket.emit("ACCEPT_CHAT_SESSION", { chatId: chatId }, (response) => {
        console.log(response);
      });

      commit("SET_CHAT_STATE_ACTIVE", chatId);
    },
    rejectChatRequest({ dispatch }, chatId) {
      dispatch("destroyChatSession", chatId);
    },
    destoryChatSession({ commit }, chatId) {
      commit("SET_CHAT_STATE_CLOSED", chatId);
      commit("REMOVE_CHAT_SESSION", chatId);
    },
    setChatStateClosed({ commit }, chatId) {
      commit("SET_CHAT_STATE_CLOSED", chatId);
    },
    emitEndChatRequest({ dispatch }, chatId) {
      console.log("emitEndChatRequest(): dispatching action. chatId=" + chatId);
      this._vm.$socket.emit("END_CHAT_SESSION", { chatId: chatId }, (response) => {
        console.log("END_CHAT_SESSION() response=" + JSON.stringify(response));
        if (response.responseCode === "0") {
          dispatch("setChatStateClosed", chatId);
        }
      });
    },

    emitAgentTypingStarted({}, chatId) {
      this._vm.$socket.emit(
        "AGENT_TYPING_STARTED",
        { chatId: chatId },
        response => {
          console.log("sent chat message=" + JSON.stringify(response));
        }
      );
    },
    emitAgentTypingStopped({}, chatId) {
      this._vm.$socket.emit(
        "AGENT_TYPING_STOPPED",
        { chatId: chatId },
        response => {
          console.log("sent chat message=" + JSON.stringify(response));
        }
      );
    },

    setChatIsTyping({ commit }, payload) {
      commit("SET_CHAT_IS_TYPING", payload.chatId);
    },
    resetChatIsTyping({ commit }, payload) {
      commit("RESET_CHAT_IS_TYPING", payload.chatId);
    },
  },
  getters: {
    getChatSidebarState(state) {
      return state.showChatSidebar;
    },
    getChatSessions(state) {
      return state.chatSessions;
    },

    getChatSessionCount(state) {
      return state.chatSessions.length;
    },
    getChatSessionById: (state) => (chatId) => {
      const index = state.chatIds.indexOf(chatId);
      return state.chatSessions[index];
    },
    getChatIndexById: (state) => (chatId) => {
      return state.chatIds.indexOf(chatId);
      // TODO: fix chat Index ID

    },
    getMessageList: (state) => (chatId) => {
      return state.chatSessions[state.chatIds.indexOf(chatId)].messageList;
    },


    /*
getMessageList: function(state){
return  function(chatId) {
      return state.chatSessions[state.chatIds.indexOf(chatId)].messageList;
    },

} 



    */
    getMessageListLength: (state) => (chatId) => {
      return state.chatSessions[state.chatIds.indexOf(chatId)].messageList.length;
    },
    getIsTyping: (state) => (chatId) => {
      return state.chatSessions[state.chatIds.indexOf(chatId)].isTyping;
    },
  },
};
