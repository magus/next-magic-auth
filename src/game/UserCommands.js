function UserCommandFactory(type) {
  function UserCommand(data, time = Date.now()) {
    return [type, { time, data }];
  }

  UserCommand.type = type;

  return UserCommand;
}

export const Move = new UserCommandFactory('movement');
