import Link from "next/link";
import Image from "next/image";
export function Brand() {
  return (
    <Link className="brand" href="/" aria-label="ConserjerIA, inicio comercial">
      <Image src="/brand/favicon.svg" width={36} height={36} alt="" />
      <span>
        Conserjer<b>IA</b>
      </span>
    </Link>
  );
}
