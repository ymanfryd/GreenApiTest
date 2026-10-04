import { avatarGradient, initials } from "../utils/chat";

type Props = {
  name: string;
  phone: string;
  seed: string;
};

export default function Avatar({ name, phone, seed }: Props) {
  const [from, to] = avatarGradient(seed);

  return (
    <span
      className="avatar"
      style={{ backgroundImage: `linear-gradient(135deg, ${from}, ${to})` }}
      aria-hidden="true"
    >
      {initials(name, phone)}
    </span>
  );
}
