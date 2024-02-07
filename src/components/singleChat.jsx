import {
  Box,
  FormControl,
  IconButton,
  Input,
  Spinner,
  Text,
  useToast,
} from "@chakra-ui/react";
import {ChatState} from "../context/chatProvider";
import {ArrowBackIcon} from "@chakra-ui/icons";
import {getSender, getSenderFull} from "../config/chatLogics";
import ProfileModal from "./miscellaneous/profileModal";
import UpdateGroupChatModal from "./miscellaneous/updateGroupChatModal";
import {useEffect, useRef, useState} from "react";
import axios from "axios";
import animationData from "../assets/animations/typing.json";
import "./styles.css";
import io from "socket.io-client";
import ScrollableChat from "./scrollableChat";
import Lottie from "react-lottie";
import EmojiPicker from "emoji-picker-react";

const ENDPOINT = process.env.REACT_APP_API_URL;
let socket, selectedChatCompare;

const SingleChat = ({fetchAgain, setFetchAgain}) => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [newMessage, setNewMessage] = useState("");
  const [socketConnected, setSocketConnected] = useState(false);
  const [typing, setTyping] = useState(false);
  const [istyping, setIstyping] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const emojiPickerRef = useRef(null);

  const {user, selectedChat, setSelectedChat, notification, setNotification} =
    ChatState();
  const toast = useToast();
  let defaultOptions = {
    loop: true,
    autoplay: true,
    animationData: animationData,
    rendererSettings: {
      preserveAspectRatio: "xMidYMid slice",
    },
  };

  const fetchMessages = async () => {
    if (!selectedChat) return;
    try {
      const config = {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      };
      setLoading(true);
      const {data} = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/message/${selectedChat._id}`,
        config
      );

      setMessages(data);
      setLoading(false);
      socket.emit("join chat", selectedChat._id);
    } catch (error) {
      toast({
        title: "Error Occured!",
        description: "Failed to Load the messages",
        status: "error",
        duration: 3000,
        isClosable: true,
        position: "bottom",
      });
    }
  };

  const handleClick = async () => {
    setShowEmojiPicker(false);
    socket.emit("stop typing", selectedChat._id);
    try {
      const config = {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.token}`,
        },
      };

      setNewMessage("");
      const {data} = await axios.post(
        `${process.env.REACT_APP_API_URL}/api/message`,
        {
          content: newMessage,
          chatId: selectedChat._id,
        },
        config
      );
      socket.emit("new Message", data);
      setMessages([...messages, data]);
    } catch (error) {
      toast({
        title: "Error Occured!",
        description: "Failed to send the Message",
        status: "error",
        duration: 5000,
        isClosable: true,
        position: "bottom",
      });
    }
  };

  const sendMessage = async (e) => {
    if (e.key === "Enter" && newMessage) {
      socket.emit("stop typing", selectedChat._id);
      try {
        const config = {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${user.token}`,
          },
        };

        setNewMessage("");
        const {data} = await axios.post(
          `${process.env.REACT_APP_API_URL}/api/message`,
          {
            content: newMessage,
            chatId: selectedChat._id,
          },
          config
        );
        socket.emit("new Message", data);
        setMessages([...messages, data]);
      } catch (error) {
        toast({
          title: "Error Occured!",
          description: "Failed to send the Message",
          status: "error",
          duration: 5000,
          isClosable: true,
          position: "bottom",
        });
      }
    }
  };
  const typingHandler = (e) => {
    setNewMessage(e.target.value);

    if (!socketConnected) return;

    if (!typing) {
      setTyping(true);
      socket.emit("typing", selectedChat._id);
    }

    let lastTypingTime = new Date().getTime();
    let timerLength = 3000;

    setTimeout(() => {
      let timeNow = new Date().getTime();
      let timeDiff = timeNow - lastTypingTime;

      if ((timeDiff >= timerLength) & typing) {
        socket.emit("stop typing", selectedChat._id);
        setTyping(false);
      }
    }, timerLength);
  };

  const onEmojiClick = (emojiData) => {
    setNewMessage((prev) => prev + emojiData.emoji);
  };

  useEffect(() => {
    socket = io(ENDPOINT);
    socket.emit("setup", user);
    socket.on("connected", () => setSocketConnected(true));
    socket.on("typing", () => setIstyping(true));
    socket.on("stop typing", () => setIstyping(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    fetchMessages();
    selectedChatCompare = selectedChat;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedChat]);

  useEffect(() => {
    socket.on("message received", (newMessageReceived) => {
      if (
        !selectedChatCompare ||
        selectedChatCompare._id !== newMessageReceived.chat._id
      ) {
        if (!notification.includes(newMessageReceived)) {
          setNotification([newMessageReceived, ...notification]);
          setFetchAgain(!fetchAgain);
        }
      } else {
        setMessages([...messages, newMessageReceived]);
      }
    });
  });

  useEffect(() => {
    const handleClickOutsideEmojiPicker = (event) => {
      if (
        showEmojiPicker &&
        emojiPickerRef.current &&
        !emojiPickerRef.current.contains(event.target)
      ) {
        setShowEmojiPicker(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutsideEmojiPicker);

    return () => {
      document.removeEventListener("mousedown", handleClickOutsideEmojiPicker);
    };
  }, [showEmojiPicker]);

  return (
    <>
      {selectedChat ? (
        <>
          <Text
            fontSize={{base: "28px", md: "30px"}}
            pb={3}
            px={2}
            w="100%"
            fontFamily="Work sans"
            display="flex"
            justifyContent={{base: "space-between"}}
            alignItems="center"
          >
            <IconButton
              display={{base: "flex", md: "none"}}
              icon={<ArrowBackIcon />}
              onClick={() => setSelectedChat("")}
            />
            {messages &&
              (!selectedChat.isGroupChat ? (
                <>
                  {getSender(user, selectedChat.users)}
                  <ProfileModal
                    user={getSenderFull(user, selectedChat.users)}
                  />
                </>
              ) : (
                <>
                  {selectedChat.chatName.toUpperCase()}
                  <UpdateGroupChatModal
                    fetchMessages={fetchMessages}
                    fetchAgain={fetchAgain}
                    setFetchAgain={setFetchAgain}
                  />
                </>
              ))}
          </Text>
          <Box
            display="flex"
            flexDir="column"
            justifyContent="flex-end"
            p={3}
            bg="#E8E8E8"
            w="100%"
            h="100%"
            borderRadius="lg"
            overflowY="hidden"
          >
            {loading ? (
              <Spinner
                size="xl"
                w={20}
                h={20}
                alignSelf="center"
                margin="auto"
              />
            ) : (
              <div className="messages">
                <ScrollableChat messages={messages} />
              </div>
            )}
            {istyping ? (
              <div>
                <Lottie
                  options={defaultOptions}
                  width={70}
                  height={35}
                  style={{
                    marginLeft: 0,
                    marginTop: 15,
                  }}
                />
              </div>
            ) : (
              <></>
            )}

            <FormControl
              onKeyDown={sendMessage}
              id="first-name"
              isRequired
              mt={3}
              display={'flex'}

            >
              <Box
                className="emoji"
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              >
                {showEmojiPicker ? (
                  <i class="fas fa-times-circle"></i>
                ) : (
                  <i class="fas fa-laugh"></i>
                )}
              </Box>
              <Input
                variant="filled"
                placeholder="Enter a message.."
                value={newMessage}
                onChange={typingHandler}
                ml={2}
                mr={2}
                outline={"none"}
                border={"none"}
                bg={newMessage ? "#E0E0E0" : "#fff"}
                _focus={{
                  bg: "#E0E0E0",
                }}
              />
              <Box className="emoji" onClick={handleClick}>
                <i
                  className="fas fa-arrow-alt-circle-right"
                  style={{color: newMessage && "#38B2AC"}}
                ></i>
              </Box>
            </FormControl>
            {showEmojiPicker && (
              <Box ref={emojiPickerRef} h={"40%"}>
                <EmojiPicker
                  id={"emoji-picker"}
                  searchDisabled={true}
                  style={{width: "100%", marginTop: "10px"}}
                  onEmojiClick={onEmojiClick}
                  previewConfig={{
                    showPreview: false,
                  }}
                />
              </Box>
            )}
          </Box>
        </>
      ) : (
        <Box
          display="flex"
          alignItems="center"
          justifyContent="center"
          h="100%"
        >
          <Text fontSize="3xl" pb={3} fontFamily="Work sans">
            Click on a user to start chatting
          </Text>
        </Box>
      )}
    </>
  );
};

export default SingleChat;
