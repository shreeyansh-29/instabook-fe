import {CloseIcon} from "@chakra-ui/icons";
import {Box} from "@chakra-ui/react";
const UserBadgeItem = ({user, handleFunction, admin}) => {
  return (
    <Box
      px={2}
      py={1}
      borderRadius={"lg"}
      m={1}
      mb={2}
      // variant="solid"
      fontSize={12}
      bg="purple"
      color={"#fff"}
      cursor="pointer"
      onClick={handleFunction}
    >
      {user.name}
      {admin && admin._id === user._id && <span> (Admin)</span>}
      <CloseIcon pl={1} />
    </Box>
  );
};

export default UserBadgeItem;
