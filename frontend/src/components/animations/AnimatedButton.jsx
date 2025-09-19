import { motion as Motion } from 'framer-motion'
import { Button } from '@chakra-ui/react'

const buttonVariants = {
  hover: {
    scale: 1.05,
    transition: {
      duration: 0.2,
      type: "tween",
      ease: "easeOut"
    }
  },
  tap: {
    scale: 0.95,
    transition: {
      duration: 0.1,
      type: "tween",
      ease: "easeOut"
    }
  }
}

const AnimatedButton = ({ children, ...props }) => {
  return (
    <Motion.div
      variants={buttonVariants}
      whileHover="hover"
      whileTap="tap"
      style={{ display: 'inline-block' }}
    >
      <Button {...props}>
        {children}
      </Button>
    </Motion.div>
  )
}

export default AnimatedButton
