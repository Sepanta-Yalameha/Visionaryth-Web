import Image from 'next/image';

type Props = { className?: string; priority?: boolean };

export default function Logo({ className = '', priority = false }: Props) {
  return (
    <Image
      src="/Visionaryth_Logo.png"
      alt="Visionaryth"
      width={180}
      height={40}
      priority={priority}
      className={className}
    />
  );
}
